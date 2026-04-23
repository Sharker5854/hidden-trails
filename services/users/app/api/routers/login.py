import uuid
import urllib
from typing import Optional, Annotated, List
from pathlib import Path
from fastapi import APIRouter, Depends, Form, HTTPException, status, Request, Response, UploadFile, File, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import EmailStr
from sqlalchemy import text
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt
from app.core.config import settings
from app.api.deps import get_db, get_current_user, get_auth_service, get_users_service, get_all_themes
from app.models import User, Theme, Geotag, Comment, Achievment
from app.services.auth import AuthService
from app.services.users import UsersService
from app.schemas.users import UserPublic, UserUpdateForm
from app.schemas.auth import AuthResponse, RegisterForm, LoginForm, SessionResponse



router = APIRouter(prefix="/auth", tags=["auth"])
templates = Jinja2Templates(directory="app/templates")

AVATARS_DIR = settings.base_dir / "static" / "media" / "user-avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)


def serialize_user(user: User) -> UserPublic:
    user.theme_ids = [theme.id for theme in user.themes]
    return UserPublic.model_validate(user)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        max_age=15 * 60,
        path="/",
        samesite="lax",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        max_age=7 * 86400,
        path="/",
        samesite="lax",
    )


@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse(
        "auth/register.html", {"request": request, "title": "Регистрация"}
    )


@router.post("/register")
async def register(
    response: Response,
    form_data: Annotated[RegisterForm, Form(...)],
    auth_svc: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        form_data.validate_passwords_match()
        
        user = await auth_svc.register(
            email=form_data.email,
            nickname=form_data.nickname,
            password=form_data.password
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
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
    set_auth_cookies(response, access_token, refresh_token)
    return AuthResponse(access_token=access_token, refresh_token=refresh_token, user=user)
    
    resp = RedirectResponse("/auth/me", status_code=302)
    resp.set_cookie("access_token", access_token, httponly=True, max_age=15*60)
    resp.set_cookie("refresh_token", refresh_token, httponly=True, max_age=7*86400)
    return resp



@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request, "title": "Авторизация"})


@router.post("/login")
async def login(
    response: Response,
    form_data: Annotated[LoginForm, Form(...)],
    auth_svc: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    user = await auth_svc.authenticate(form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password.",
        )
        return templates.TemplateResponse(
            "auth/login.html",
            {"request": request, "title": "Авторизация", "error": "Неверный email или пароль."},
            status_code=400,
        )

    access_token = auth_svc.create_access_token(user.id)
    refresh_token = auth_svc.create_refresh_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)
    return AuthResponse(access_token=access_token, refresh_token=refresh_token, user=user)

    resp = RedirectResponse("/auth/me", status_code=status.HTTP_302_FOUND)
    resp.set_cookie("access_token", access_token, httponly=True, max_age=15 * 60, samesite="lax")
    resp.set_cookie("refresh_token", refresh_token, httponly=True, max_age=7 * 86400, samesite="lax")
    return resp


@router.post("/refresh")
async def refresh(
    request: Request,
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
        json_response = JSONResponse({"status": "refreshed"})
        json_response.set_cookie(
            "access_token",
            new_access,
            httponly=True,
            max_age=15 * 60,
            path="/",
            samesite="lax",
        )
        return json_response
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired.")
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(e))




@router.get("/session", response_model=SessionResponse)
async def session(
    request: Request,
    auth_svc: AuthService = Depends(get_auth_service),
    users_svc: UsersService = Depends(get_users_service),
) -> SessionResponse:
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")

    if not access_token:
        return SessionResponse(user=None, can_refresh=bool(refresh_token))

    try:
        payload = auth_svc.decode_token(access_token)
        if payload.type != "access":
            return SessionResponse(user=None, can_refresh=bool(refresh_token))

        user = await users_svc.get_by_id(int(payload.sub))
    except (ValueError, jwt.ExpiredSignatureError):
        return SessionResponse(user=None, can_refresh=bool(refresh_token))

    if not user:
        return SessionResponse(user=None, can_refresh=bool(refresh_token))

    return SessionResponse(user=serialize_user(user), can_refresh=bool(refresh_token))


@router.get("/me", response_model=UserPublic)
async def me_page(
    current_user: User = Depends(get_current_user),
) -> UserPublic:
    return serialize_user(current_user)


@router.post("/me", response_model=UserPublic)
async def me_post(
    request: Request,
    users_svc: Annotated[UsersService, Depends(get_users_service)],

    email: EmailStr = Form(...),
    nickname: str = Form(...),
    phone: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
    surname: Optional[str] = Form(None),
    theme_ids: Optional[List[int]] = Form(default=[]),
    avatar_file: Optional[UploadFile] = File(None, alias="avatar_url"),

    current_user: User = Depends(get_current_user)
):
    form_data = {
        "email": email,
        "nickname": nickname,
        "phone": phone,
        "name": name,
        "surname": surname,
        "theme_ids": theme_ids,
        "is_moder": current_user.is_moder,
        "is_admin": current_user.is_admin,
        "is_premium": current_user.is_premium,
    }

    try:
        validated_form = UserUpdateForm.model_validate(form_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        return templates.TemplateResponse(
            "auth/me.html",
            {
                "request": request,
                "current_user": current_user,
                "error": f"Ошибка валидации: {e}",
                "all_themes": await get_all_themes()
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        return templates.TemplateResponse(
            "auth/me.html",
            {
                "request": request,
                "current_user": current_user,
                "error": f"{e}",
                "all_themes": await get_all_themes()
            },
            status_code=400,
        )
    
    return serialize_user(updated_user)


@router.post("/premium/toggle", response_model=UserPublic)
async def toggle_premium(
    users_svc: Annotated[UsersService, Depends(get_users_service)],
    current_user: User = Depends(get_current_user),
) -> UserPublic:
    current_user.is_premium = not current_user.is_premium
    await users_svc.db.commit()
    await users_svc.db.refresh(current_user)
    return serialize_user(current_user)




@router.get("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"status": "logged_out"}



@router.get("/forgot-password")
async def forgot_password_form(
        request: Request
    ):
    """Форма 'Забыли пароль?'"""
    return templates.TemplateResponse(
        "auth/forgot-password.html",
        {"request": request}
    )


@router.post("/forgot-password")
async def forgot_password(
    request: Request,
    background_tasks: BackgroundTasks,
    email: str = Form(..., description="Email для сброса"),
    auth_svc: AuthService = Depends(get_auth_service)
):
    """Запрос сброса пароля."""
    result = await auth_svc.request_password_reset(email, background_tasks)


    return templates.TemplateResponse(
        "auth/forgot-password.html",
        context={
            "request": request, 
            "message": result["message"], 
            "success": True
        },
        status_code=303
    )



@router.get("/reset-password")
async def reset_password_form(
    request: Request,
    token: Optional[str] = None
):
    """Форма сброса пароля."""
    return templates.TemplateResponse(
        "auth/reset-password.html",
        {
            "request": request,
            "token": token
        }
    )


@router.post("/reset-password")
async def reset_password(
    request: Request,
    token: str = Form(...),
    new_password: str = Form(...),
    auth_svc: AuthService = Depends(get_auth_service)
):
    """Сброс пароля по ссылке."""
    try:
        result = await auth_svc.reset_password(token, new_password)
        return RedirectResponse(
            "/auth/login",
            status_code=303
        )
    except HTTPException:
        return templates.TemplateResponse(
            "auth/reset-password.html",
            context={
                "request": request,
                "token": token,
                "message": "Ошибка!",
                "status": False
            },
            status_code=303
        )




#################################################################################################################
#################################################################################################################
#################################################################################################################



@router.get("/health")
async def health():
    return {"status": "healthy"}
