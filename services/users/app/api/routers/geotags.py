import uuid
from typing import Optional, List, Annotated
from pathlib import Path
from fastapi import Path as QueryPath
from fastapi import APIRouter, Request, Depends, Form, HTTPException, UploadFile, File
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.templating import Jinja2Templates
from transliterate import translit
from app.core.config import settings
from app.models import User
from app.schemas.geotags import GeotagPublic
from app.schemas.geotags import GeotagCreateForm, GeotagUpdateForm
from app.services.themes import ThemesService
from app.services.geotags import GeotagsService
from app.api.deps import get_current_user, get_themes_service, get_geotags_service



# Эндпоинт сохранения геометки других пользователей +++
# Эндпоинт под лайки +++
# Лента +++
# Поправить ленту, чтобы свои статьи не вываливались сверху, даже если по интересам идеально совпадают +++
# Подписка на пользователя +++
# Эндпоинт под добавление интересов пользователя (в профиле) +++
# Эндпоинты под создание комментов и сабкомментов
# Лайканье комментов
# Страница с картой
# Админка
# Забыли пароль? 



router = APIRouter(prefix="/geotag", tags=["geotags"])
templates = Jinja2Templates(directory="app/templates")

MEDIA_DIR = settings.base_dir / "static" / "media" / "geotag-media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)



@router.get("/show/{geotag_id}")
async def get_geotag(
    request: Request,
    geotag_id: int,
    geotags_svc: GeotagsService = Depends(get_geotags_service),
):
    geotag = await geotags_svc.get_geotag_public(geotag_id)
    if not geotag:
        raise HTTPException(status_code=404, detail="Геометка не найдена")
    return geotag


@router.get("/create")
async def create_geotag_form(
    request: Request,
    current_user: User = Depends(get_current_user),
    themes_svc: ThemesService = Depends(get_themes_service),
):
    themes = await themes_svc.get_all_themes()
    return templates.TemplateResponse(
        "geotags/create.html",
        {
            "request": request,
            "user": current_user,
            "themes": themes,
        },
    )


@router.post("/create")
async def create_geotag_post(
    request: Request,
    current_user: User = Depends(get_current_user),
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    themes_svc: ThemesService = Depends(get_themes_service),
    
    title: str = Form(...),
    text: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    warnings: Optional[str] = Form(None),
    tips: Optional[str] = Form(None),
    
    theme_ids: Optional[List[int]] = Form(...),
    
    media_files: Optional[List[UploadFile]] = File(None, alias="media_files"),
):
    form_data = {
        "title": title,
        "text": text,
        "latitude": latitude,
        "longitude": longitude,
        "warnings": warnings,
        "tips": tips,
        "theme_ids": theme_ids,
    }
    
    try:
        validated_form = GeotagCreateForm.model_validate(form_data)
    except ValueError as e:
        themes = await themes_svc.get_all_themes()
        return templates.TemplateResponse(
            "geotags/create.html",
            {"request": request, "user": current_user, "themes": themes, "error": str(e)},
            status_code=400,
        )

    media_file_paths = []
    for i, media_file in enumerate(media_files):
        if media_file.filename:
            ext = Path(media_file.filename).suffix or ".jpg"
            safe_title = translit(
                form_data['title'].lower(), 
                language_code='ru', 
                reversed=True
            ).replace(" ", "_")[:50]
            filename = f"geotag_{safe_title}_{uuid.uuid4().hex}{ext}"
            disk_path = MEDIA_DIR / filename
            
            contents = await media_file.read()
            disk_path.write_bytes(contents)
            
            media_file_paths.append({filename})

    
    try:
        geotag = await geotags_svc.create_geotag(
            form=validated_form,
            author_id=current_user.id,
            media_files=media_file_paths,
        )
    except ValueError as e:
        themes = await themes_svc.get_all_themes()
        return templates.TemplateResponse(
            "geotags/create.html",
            {"request": request, "user": current_user, "themes": themes, "error": str(e)},
            status_code=400,
        )
    
    return RedirectResponse(f"/geotag/show/{geotag.id}", status_code=302)





@router.get("/update/{geotag_id}")
@router.post("/update/{geotag_id}")
async def update_geotag(
    request: Request,
    geotag_id: int,
    geotags_svc: Annotated[GeotagsService, Depends(get_geotags_service)],
    themes_svc: Annotated[ThemesService, Depends(get_themes_service)],
    
    title: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    warnings: Optional[str] = Form(None),
    tips: Optional[str] = Form(None),
    theme_ids: Optional[List[int]] = Form(None),
    
    media_files: Optional[List[UploadFile]] = File(None, alias="media_files"),
    current_user: User = Depends(get_current_user),
):
    
    geotag = await geotags_svc.get_by_id(geotag_id)
    if not geotag:
        raise HTTPException(404, "Геометка не найдена!")
    
    if not geotag.author_id == current_user.id:
        raise HTTPException(401, "Нельзя изменять геометки принадлежащие другим пользователям.")

    all_themes = await themes_svc.get_all_themes()
    
    if request.method == "GET":
        return templates.TemplateResponse(
            "geotags/update.html",
            {
                "request": request,
                "geotag": geotag,
                "themes": all_themes,
                "selected_theme_ids": [t.id for t in geotag.themes],
            },
        )
    
    form_data = {
        "title": title,
        "text": text,
        "latitude": latitude,
        "longitude": longitude,
        "warnings": warnings,
        "tips": tips,
        "theme_ids": theme_ids,
    }
    
    try:
        validated_form = GeotagUpdateForm.model_validate(form_data)
    except ValueError as e:
        return templates.TemplateResponse(
            "geotags/update.html",
            {
                "request": request,
                "geotag": geotag,
                "themes": all_themes,
                "selected_theme_ids": [t.id for t in geotag.themes],
                "error": f"Ошибка формы: {e}",
            },
            status_code=400,
        )
    
    raw_media = getattr(geotag, 'media_files', [])
    current_media = []
    if isinstance(raw_media, list):
        for item in raw_media:
            if isinstance(item, list):
                current_media.extend([str(x) for x in item if x])
            elif isinstance(item, str) and item.strip():
                current_media.append(item.strip())

    new_media_paths = []
    
    for media_file in media_files:
        if media_file.filename:
            ext = Path(media_file.filename).suffix or ".png"
            safe_title = translit(
                form_data['title'].lower(), 
                language_code='ru', 
                reversed=True
            ).replace(" ", "_")[:50]
            filename = f"geotag_{safe_title}_{uuid.uuid4().hex}{ext}"
            disk_path = MEDIA_DIR / filename
            
            contents = await media_file.read()
            disk_path.write_bytes(contents)
            
            new_media_paths.append(f"{filename}")
    
    updated_media = current_media + new_media_paths
    
    try:
        updated_geotag = await geotags_svc.update_geotag(
            geotag=geotag,
            form=validated_form,
            media_files=updated_media,
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "geotags/update.html",
            {
                "request": request,
                "geotag": geotag,
                "themes": all_themes,
                "selected_theme_ids": [t.id for t in geotag.themes],
                "error": str(e),
            },
            status_code=400,
        )
    
    return RedirectResponse(f"/geotag/show/{geotag_id}", status_code=302)



@router.post("/save/{geotag_id}")
async def save_geotag(
    geotag_id: int,
    geotags_svc: Annotated[GeotagsService, Depends(get_geotags_service)],
    user: User = Depends(get_current_user),
):
    
    result = await geotags_svc.save_geotag(
        user_id=user.id,
        geotag_id=geotag_id
    )
    
    return JSONResponse(status_code=200, content=result)


@router.post("/unsave/{geotag_id}")
async def unsave_geotag(
    geotag_id: int,
    geotags_svc: Annotated[GeotagsService, Depends(get_geotags_service)],
    user: User = Depends(get_current_user),
):
    
    result = await geotags_svc.unsave_geotag(
        user_id=user.id,
        geotag_id=geotag_id
    )
    
    return JSONResponse(status_code=200, content=result)



@router.get("/feed")
async def get_feed(
    geotags_svc: Annotated[GeotagsService, Depends(get_geotags_service)],
    limit: int = 10,
    user: User = Depends(get_current_user),
):
    feed = await geotags_svc.geotags_feed(
        user_id=user.id,
        limit=limit,
    )
    
    public_geotags: List[GeotagPublic] = jsonable_encoder([
        GeotagPublic.from_orm(gt)
        for gt in feed
    ])

    return JSONResponse(
        status_code=200, 
        content={
            "geotags": public_geotags,
            "total": len(public_geotags),
        }
    )



@router.post("/like/{geotag_id}")
async def like_geotag(
    geotag_id: int = QueryPath(..., ge=1),
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    user: User = Depends(get_current_user),
):
    result = await geotags_svc.like_geotag(user.id, geotag_id)
    return JSONResponse(status_code=200, content=result)

@router.post("/unlike/{geotag_id}")
async def unlike_geotag(
    geotag_id: int = QueryPath(..., ge=1),
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    user: User = Depends(get_current_user),
):
    result = await geotags_svc.unlike_geotag(user.id, geotag_id)
    return JSONResponse(status_code=200, content=result)