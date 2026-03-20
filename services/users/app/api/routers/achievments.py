import uuid
from pathlib import Path
from typing import Annotated, Optional
from fastapi import APIRouter, Request, Depends, Form, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from transliterate import translit
from app.core.config import settings
from app.models import User, Achievment
from app.schemas.achievments import AchievmentsCreateUpdate
from app.services.achievments import AchievmentsService
from app.api.deps import get_current_user, admin_user, get_achievments_service


router = APIRouter(prefix="/achievment", tags=["achievments"])
templates = Jinja2Templates(directory="app/templates")

PICTURES_DIR = settings.base_dir / "static" / "media" / "achievment-pictures"
PICTURES_DIR.mkdir(parents=True, exist_ok=True)



@router.get("/all")
async def get_all(
    request: Request,
    admin_user: Annotated[User, Depends(admin_user)],
    achievments_svc: AchievmentsService = Depends(get_achievments_service)
):
    achievments = await achievments_svc.get_all_achievments()
    return {"achievments": achievments}


@router.get("/create")
async def create(
    request: Request,
    admin_user: Annotated[User, Depends(admin_user)],
):
    return templates.TemplateResponse(
        "achievments/create.html",
        {"request": request, "title": "Создание нового достижения", "current_user": admin_user}
    )


@router.post("/create")
async def create(
    request: Request,

    title: str = Form(...),
    picture_file: UploadFile = File(None, alias="picture_url"),

    admin_user: User = Depends(admin_user),
    achievments_svc: AchievmentsService = Depends(get_achievments_service)
):
    form_data = {
        "title": title
    }

    try:
        validated_form = AchievmentsCreateUpdate.model_validate(form_data)
    except ValueError as e:
        return templates.TemplateResponse(
            "achievments/create.html",
            {
                "request": request,
                "current_user": admin_user,
                "error": f"Ошибка валидации: {e}",
            },
            status_code=400,
        )

    picture_path = None
    if picture_file and picture_file.filename:
        ext = Path(picture_file.filename).suffix
        filename = f"achievment_{translit(title.lower(), language_code='ru', reversed=True).replace(" ", "_").replace("/", "_")}{ext}"
        disk_path = PICTURES_DIR / filename
        contents = await picture_file.read()
        disk_path.write_bytes(contents)
        picture_path = f"{filename}"

    try:
        achievment = await achievments_svc.create_achievment(
            data=validated_form,
            picture_url=picture_path,
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "achievments/create.html",
            {
                "request": request,
                "current_user": admin_user,
                "error": str(e),
            },
            status_code=400,
        )

    return RedirectResponse(url="/achievment/create", status_code=302)



@router.get("/update/{id}")
@router.post("/update/{id}")
async def edit_achievment(
    request: Request,
    id: int,
    achievments_svc: Annotated[AchievmentsService, Depends(get_achievments_service)],
    admin_user: Annotated[User, Depends(admin_user)],
    
    # GET: ничего не нужно
    # POST: форма + файл
    title: str = Form(None),
    picture_file: Optional[UploadFile] = File(None, alias="picture_url"),
):
    achievment = await achievments_svc.get_by_id(id)
    
    if not achievment:
        raise HTTPException(404, f"Достижение c ID {id} не найдено!")
    
    if request.method == "GET":
        return templates.TemplateResponse(
            "achievments/update.html",
            {
                "request": request,
                "title": "Редактирование достижения",
                "achievment": achievment,
                "user": admin_user,
            },
        )
    
    form_data = {"title": title}
    try:
        validated_form = AchievmentsCreateUpdate.model_validate(form_data)
    except ValueError as e:
        return templates.TemplateResponse(
            "achievments/update.html",
            {
                "request": request,
                "title": "Редактирование достижения",
                "achievment": achievment,
                "user": admin_user,
                "error": f"Ошибка валидации: {e}",
            },
            status_code=400,
        )
    
    new_picture_path = achievment.picture_url
    if picture_file and picture_file.filename:
        ext = Path(picture_file.filename).suffix or ".png"
        safe_title = translit(
            title.lower(), 
            language_code='ru', 
            reversed=True
        ).replace(" ", "_")[:50]
        filename = f"achievment_{safe_title}_{uuid.uuid4().hex[:8]}{ext}"
        
        disk_path = PICTURES_DIR / filename
        contents = await picture_file.read()
        disk_path.write_bytes(contents)
        new_picture_path = filename
    
    try:
        updated_achievment = await achievments_svc.update_achievment(
            achievment=achievment,
            form=validated_form,
            picture_url=new_picture_path,
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "achievments/update.html",
            {
                "request": request,
                "title": "Редактирование достижения",
                "achievment": achievment,
                "user": admin_user,
                "error": str(e),
            },
            status_code=400,
        )
    
    return RedirectResponse("/achievment/all", status_code=302)