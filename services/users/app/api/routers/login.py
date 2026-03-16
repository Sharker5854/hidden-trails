import uuid
from typing import Optional, Annotated
from pathlib import Path
from fastapi import APIRouter, Depends, Form, HTTPException, status, Request, Response, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import EmailStr
from sqlalchemy import text
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt
from app.core.config import settings
from app.api.deps import get_db, get_current_user, get_auth_service, get_users_service
from app.models import User, Theme, Geotag, Comment, Achievment
from app.services.auth import AuthService
from app.services.users import UsersService
from app.schemas.users import UserPublic, UserUpdateForm
from app.schemas.auth import RegisterForm, LoginForm



router = APIRouter(prefix="/auth", tags=["auth"])
templates = Jinja2Templates(directory="app/templates")

AVATARS_DIR = settings.base_dir / "static" / "media" / "user-avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse(
        "auth/register.html", {"request": request, "title": "Регистрация"}
    )


@router.post("/register")
async def register(
    request: Request,
    response: Response,
    form_data: Annotated[RegisterForm, Form(...)],
    auth_svc: AuthService = Depends(get_auth_service),
):
    try:
        form_data.validate_passwords_match()
        
        user = await auth_svc.register(
            email=form_data.email,
            nickname=form_data.nickname,
            password=form_data.password
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "auth/register.html",
            {
                "request": request,
                "title": "Регистрация",
                "error": str(e),
            },
            status_code=400
        )

    access_token = auth_svc.create_access_token(user.id)
    refresh_token = auth_svc.create_refresh_token(user.id)
    
    resp = RedirectResponse("/auth/me", status_code=302)
    resp.set_cookie("access_token", access_token, httponly=True, max_age=15*60)
    resp.set_cookie("refresh_token", refresh_token, httponly=True, max_age=7*86400)
    return resp



@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request, "title": "Авторизация"})


@router.post("/login")
async def login(
    request: Request,
    response: Response,
    form_data: Annotated[LoginForm, Form(...)],
    auth_svc: AuthService = Depends(get_auth_service),
):
    user = await auth_svc.authenticate(form_data.email, form_data.password)
    if not user:
        return templates.TemplateResponse(
            "auth/login.html",
            {"request": request, "title": "Авторизация", "error": "Неверный email или пароль."},
            status_code=400,
        )

    access_token = auth_svc.create_access_token(user.id)
    refresh_token = auth_svc.create_refresh_token(user.id)

    resp = RedirectResponse("/auth/me", status_code=status.HTTP_302_FOUND)
    resp.set_cookie("access_token", access_token, httponly=True, max_age=15 * 60, samesite="lax")
    resp.set_cookie("refresh_token", refresh_token, httponly=True, max_age=7 * 86400, samesite="lax")
    return resp


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    auth_svc: AuthService = Depends(get_auth_service),
    users_svc: UsersService = Depends(get_users_service),
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token.")
    
    try:
        payload = auth_svc.decode_token(refresh_token)
        if payload.type != "refresh":
            raise ValueError("Wrong token type.")
        
        user = await users_svc.get_by_id(int(payload.sub))
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found.")
        
        new_access = auth_svc.create_access_token(user.id)
        response.set_cookie(
            "access_token", new_access, 
            httponly=True, max_age=15*60, samesite="lax"
        )
        response.status_code = 200
        
        return response
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired.")
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(e))




@router.get("/me")
async def me_page(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    current_user = UserPublic.model_validate(current_user)
    return templates.TemplateResponse("auth/me.html", {
        "request": request, 
        "current_user": current_user
    })


@router.post("/me")
async def me_post(
    request: Request,
    users_svc: Annotated[UsersService, Depends(get_users_service)],

    email: EmailStr = Form(...),
    nickname: str = Form(...),
    phone: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
    surname: Optional[str] = Form(None),
    is_moder: bool = Form(False),
    is_admin: bool = Form(False),
    is_premium: bool = Form(False),
    rating: int = Form(...),
    avatar_file: Optional[UploadFile] = File(None, alias="avatar_url"),

    current_user: User = Depends(get_current_user)
):
    form_data = {
        "email": email,
        "nickname": nickname,
        "phone": phone,
        "name": name,
        "surname": surname,
        "is_moder": is_moder,
        "is_admin": is_admin,
        "is_premium": is_premium,
        "rating": rating,
    }

    try:
        validated_form = UserUpdateForm.model_validate(form_data)
    except ValueError as e:
        return templates.TemplateResponse(
            "auth/me.html",
            {
                "request": request,
                "current_user": current_user,
                "error": f"Ошибка валидации: {e}",
            },
            status_code=400,
        )
    
    new_avatar_path = None
    if avatar_file and avatar_file.filename:
        ext = Path(avatar_file.filename).suffix
        filename = f"user_{current_user.id}_{uuid.uuid4().hex}{ext}"
        disk_path = AVATARS_DIR / filename
        contents = await avatar_file.read()
        disk_path.write_bytes(contents)
        new_avatar_path = f"{filename}"
    
    try:
        updated_user = await users_svc.update_user(
            user=current_user,
            form=validated_form,
            avatar_url=new_avatar_path,
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "auth/me.html",
            {
                "request": request,
                "current_user": current_user,
                "error": f"{e}",
            },
            status_code=400,
        )
    
    return RedirectResponse("/auth/me", status_code=302)




@router.get("/logout")
async def logout(response: Response):
    resp = RedirectResponse("/auth/login", status_code=status.HTTP_302_FOUND)
    resp.delete_cookie("access_token")
    resp.delete_cookie("refresh_token")
    return resp






































@router.get("/")
async def root(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT 1"))
    return {"message": "Users service is running!", "db_check": result.scalar()}

@router.get("/health")
async def health():
    return {"status": "healthy"}



@router.get("/test/followers")
async def test_followers(db: AsyncSession = Depends(get_db)):
    """Тестирует механизм подписок"""
    
    # Создаём 3 тестовых пользователя
    user1 = User(
        email="user1@test.com",
        phone="+71111111111",
        nickname="tester1",
        hashed_password="hash1",
        avatar_url="avatar1.jpg"
    )
    user2 = User(
        email="user2@test.com",
        phone="+72222222222",
        nickname="tester2",
        hashed_password="hash2",
        avatar_url="avatar2.jpg"
    )
    user3 = User(
        email="user3@test.com",
        phone="+73333333333",
        nickname="tester3",
        hashed_password="hash3",
        avatar_url="avatar3.jpg"
    )
    
    # Сохраняем
    db.add_all([user1, user2, user3])
    await db.flush()  # Получить ID!
    await db.commit()
    
    print(f"Создан user1(id={user1.id}, nick={user1.nickname})")
    print(f"Создан user2(id={user2.id}, nick={user2.nickname})")
    print(f"Создан user3(id={user3.id}, nick={user3.nickname})")
    
    # 3. Прямая вставка подписок (без relationship.append()!)
    await db.execute(
        text("""
        INSERT INTO user_follows (follower_id, following_id) 
        VALUES (:u1_id, :u2_id), (:u3_id, :u2_id)
        """),
        {"u1_id": user1.id, "u2_id": user2.id, "u3_id": user3.id}
    )
    await db.commit()
    
    print("\n=== ПОДПИСКИ СОЗДАНЫ ===")
    print("user1 → user2")
    print("user3 → user2")
    
    # 4. Читаем через relationship (теперь безопасно!)
    print("\n=== ЧТЕНИЕ ЧЕРЕЗ RELATIONSHIP ===")
    
    # Перезагружаем с eager loading
    result1 = await db.execute(
        select(User).options(selectinload(User.followers), selectinload(User.following))
        .where(User.id.in_([user1.id, user2.id, user3.id]))
    )
    users = result1.scalars().all()
    
    user1 = next(u for u in users if u.id == user1.id)
    user2 = next(u for u in users if u.id == user2.id)
    user3 = next(u for u in users if u.id == user3.id)
    
    print(f"user1.following: {[u.nickname for u in user1.following]}")
    print(f"user2.followers: {[u.nickname for u in user2.followers]}")
    print(f"user3.following: {[u.nickname for u in user3.following]}")
    
    # 5. Проверяем user_follows таблицу
    result = await db.execute(text("SELECT follower_id, following_id FROM user_follows"))
    print("\n=== user_follows ТАБЛИЦА ===")
    for row in result.fetchall():
        print(f"  {row[0]} → {row[1]}")


    print(list(x.id for x in list(user2.followers)))
    
    return {
        "status": "✅ ТЕСТ УСПЕШЕН!",
        "user1_following": [u.nickname for u in user1.following],
        "user2_followers": [u.nickname for u in user2.followers],
        "user_follows_rows": len(result.fetchall())
    }


@router.get("/test/geotag")
async def test_geotag(db: AsyncSession = Depends(get_db)):
    """✅ Полный тест Geotag + связи"""

    # 1. User1
    user1 = User(email="user11@test.com", phone="+79999999999", nickname="user1", 
                 hashed_password="hash123", avatar_url="user1.jpg")
    db.add(user1)
    await db.commit()
    print(f"✅ User1: {user1.id}")
    
    # 2. Theme
    theme = Theme(name="Горы")
    db.add(theme)
    await db.commit()
    print(f"✅ Theme: {theme.id}")
    
    # 3. Geotag
    geotag = Geotag(title="Эльбрус", text="Гора!", media_files=["1.jpg"], 
                    latitude=43.3524, longitude=42.4665, author_id=user1.id,
                    warnings="Холод", tips="Куртка", likes_count=42)
    db.add(geotag)
    await db.commit()
    print(f"✅ Geotag: {geotag.id}")
    
    # 4. ✅ geotag_themes (именованные params!)
    await db.execute(
        text("INSERT INTO geotag_themes (geotag_id, theme_id) VALUES (:g, :t)"),
        {"g": geotag.id, "t": theme.id}
    )
    await db.commit()
    print("✅ geotag_themes")
    
    # 5. Achievment
    achievment = Achievment(title="Первый_геотег", picture_url="ach1.png")
    db.add(achievment)
    await db.commit()
    print(f"✅ Achievment: {achievment.id}")
    
    # 6. ✅ user_achievements
    await db.execute(
        text("INSERT INTO user_achievements (user_id, achievement_id) VALUES (:u, :a)"),
        {"u": user1.id, "a": achievment.id}
    )
    await db.commit()
    print("✅ user_achievements")
    
    # 7. Comment1
    comment1 = Comment(text="Круто!", author_id=user1.id, geotag_id=geotag.id)
    db.add(comment1)
    await db.commit()
    print(f"✅ Comment1: {comment1.id}")
    
    # 8. Comment2 (ответ)
    comment2 = Comment(text="Давай!", author_id=user1.id, geotag_id=geotag.id, parent_id=comment1.id)
    db.add(comment2)
    await db.commit()
    print(f"✅ Comment2→{comment2.parent_id}")
    
    # 9. ✅ ПРОВЕРКА
    print("\n=== ✅ FULL SUCCESS ===")
    
    res = await db.execute(
        text("""
            SELECT a.title FROM achievments a 
            JOIN user_achievements ua ON a.id=ua.achievement_id 
            WHERE ua.user_id=:u
        """), {"u": user1.id}
    )
    print(f"User1 ачивки: {[r[0] for r in res.fetchall()]}")
    
    res = await db.execute(
        text("""
            SELECT 
                (SELECT COUNT(*) FROM geotags WHERE author_id=:u)::int,
                (SELECT COUNT(*) FROM user_achievements WHERE user_id=:u)::int,
                (SELECT COUNT(*) FROM comments WHERE geotag_id=:g)::int
        """), {"u": user1.id, "g": geotag.id}
    )
    stats = res.fetchone()
    print(f"📊 Geotags:{stats[0]} Achs:{stats[1]} Comments:{stats[2]}")
    
    return {"status": "✅ Тест завершён!", "stats": list(stats)}