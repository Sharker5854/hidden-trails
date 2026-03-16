import uuid
from pathlib import Path
from typing import Annotated
from fastapi import APIRouter, Request, Depends, Form, UploadFile, File
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from transliterate import translit
from app.core.config import settings
from app.models import User, Achievment
from app.schemas.achievments import AchievmentsCreate
from app.services.achievments import AchievmentsService
from app.api.deps import get_current_user, admin_user, get_achievments_service


router = APIRouter(prefix="/achievment", tags=["achievments"])
templates = Jinja2Templates(directory="app/templates")

PICTURES_DIR = settings.base_dir / "static" / "media" / "achievment-pictures"
PICTURES_DIR.mkdir(parents=True, exist_ok=True)



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
        validated_form = AchievmentsCreate.model_validate(form_data)
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