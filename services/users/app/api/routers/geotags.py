import uuid
from typing import Optional, List
from pathlib import Path
from fastapi import APIRouter, Request, Depends, Form, HTTPException, UploadFile, File
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from transliterate import translit
from app.core.config import settings
from app.models import User
from app.schemas.geotags import GeotagCreateForm
from app.services.themes import ThemesService
from app.services.geotags import GeotagsService
from app.api.deps import get_current_user, get_themes_service, get_geotags_service



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
    
    for i in media_files:
        print(i.filename)

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