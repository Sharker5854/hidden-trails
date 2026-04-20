import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Request, Depends, Form, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from transliterate import translit
from app.models import User
from app.schemas.themes import ThemesCreateUpdate
from app.services.themes import ThemesService
from app.api.deps import admin_user, get_current_user, get_themes_service


router = APIRouter(prefix="/theme", tags=["themes"])
templates = Jinja2Templates(directory="app/templates")



@router.get("/all")
async def get_all(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    themes_svc: ThemesService = Depends(get_themes_service)
):
    themes = await themes_svc.get_all_themes()
    return {"themes": themes}


@router.get("/create")
async def create(
    request: Request,
    admin_user: Annotated[User, Depends(admin_user)],
):
    return templates.TemplateResponse(
        "themes/create.html",
        {"request": request, "title": "Создание новой темы", "current_user": admin_user}
    )


@router.post("/create")
async def create(
    request: Request,

    name: str = Form(...),

    admin_user: User = Depends(admin_user),
    themes_svc: ThemesService = Depends(get_themes_service)
):
    form_data = {
        "name": name
    }

    try:
        validated_form = ThemesCreateUpdate.model_validate(form_data)
    except ValueError as e:
        return templates.TemplateResponse(
            "themes/create.html",
            {
                "request": request,
                "current_user": admin_user,
                "error": f"Ошибка валидации: {e}",
            },
            status_code=400,
        )

    try:
        theme = await themes_svc.create_theme(
            data=validated_form
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "themes/create.html",
            {
                "request": request,
                "current_user": admin_user,
                "error": str(e),
            },
            status_code=400,
        )

    return RedirectResponse(url="/theme/create", status_code=302)



@router.get("/update/{id}")
@router.post("/update/{id}")
async def edit_theme(
    request: Request,
    id: int,
    themes_svc: Annotated[ThemesService, Depends(get_themes_service)],
    admin_user: Annotated[User, Depends(admin_user)],
    
    # GET: ничего не нужно
    # POST: форма
    name: str = Form(None)
):
    theme = await themes_svc.get_by_id(id)
    
    if not theme:
        raise HTTPException(404, f"Тема c ID {id} не найдена!")
    
    if request.method == "GET":
        return templates.TemplateResponse(
            "themes/update.html",
            {
                "request": request,
                "title": "Редактирование темы",
                "theme": theme,
                "user": admin_user,
            },
        )
    
    form_data = {"name": name}
    try:
        validated_form = ThemesCreateUpdate.model_validate(form_data)
    except ValueError as e:
        return templates.TemplateResponse(
            "themes/update.html",
            {
                "request": request,
                "title": "Редактирование темы",
                "theme": theme,
                "user": admin_user,
                "error": f"Ошибка валидации: {e}",
            },
            status_code=400,
        )
    
    try:
        updated_theme = await themes_svc.update_theme(
            theme=theme,
            form=validated_form
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "themes/update.html",
            {
                "request": request,
                "title": "Редактирование темы",
                "theme": theme,
                "user": admin_user,
                "error": str(e),
            },
            status_code=400,
        )
    
    return RedirectResponse("/theme/all", status_code=302)
