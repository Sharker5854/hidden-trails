import datetime
from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.geotags import Geotag
from app.models.geotag_themes import geotag_themes
from app.schemas.geotags import GeotagCreateForm, GeotagPublic, GeotagUpdateForm
from app.integrations.yandexgpt import YandexGPT



class GeotagsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.yndx_gpt = YandexGPT()


    async def get_by_id(self, geotag_id: int) -> Optional[Geotag]:
        stmt = (
            select(Geotag)
            .options(
                selectinload(Geotag.themes),
                selectinload(Geotag.author)
            )
            .where(Geotag.id == geotag_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()


    async def create_geotag(
        self,
        form: GeotagCreateForm,
        author_id: int,
        media_files: List[str] = [],
    ) -> Geotag:
        geotag = Geotag(
            title=form.title,
            text=form.text,
            media_files=media_files,
            author_id=author_id,
            latitude=form.latitude,
            longitude=form.longitude,
            warnings=form.warnings,
            tips=form.tips,
            likes_count=0,
        )

        validation_result = await self.yndx_gpt.validate_profanity_and_falsification(f"Название статьи: '{geotag.title}'.  Координаты: latitude={geotag.latitude}, longitude={geotag.longitude}. Основной текст статьи: '{geotag.text}'. Текст раздела статьи с предупреждениями для путешественников: '{geotag.warnings}'. Текст раздела статьи с советами для путешественников: '{geotag.tips}'.")
        profanity, falsification = validation_result.json()["result"]["alternatives"][0]["message"]["text"].split(", ")
        print(profanity, falsification)
        if (profanity == "False" or profanity == "false") or (falsification == "False" or falsification == "false"):
            raise ValueError("Ваша статья содержит нецензурную лексику или ложные факты, которые могут ввести других пользователей в заблуждение. Исправьте статью и попробуйте еще раз.")
        elif (profanity == "True" or profanity == "true") and (falsification == "True" or falsification == "true"):
            pass
        else:
            print(f"[{datetime.datetime.now()}] При создании статьи c названием '{geotag.title}' не применилась валидация на нецензурную лексику и фальсификацию, т.к. ответ ИИ не соответствовал нужному формату. Требуется ручная модерация. Ответ: '{validation_result.json()["result"]["alternatives"][0]["message"]["text"]}'")
        
        self.db.add(geotag)
        await self.db.flush()
        
        for theme_id in form.theme_ids:
            stmt = geotag_themes.insert().values(
                geotag_id=geotag.id,
                theme_id=theme_id
            )
            await self.db.execute(stmt)
        
        await self.db.commit()
        await self.db.refresh(geotag)

        return geotag
    

    async def get_geotag_public(self, geotag_id: int) -> Optional[GeotagPublic]:
        geotag = await self.get_by_id(geotag_id)
        if not geotag:
            return None
        return GeotagPublic.from_orm(geotag)
    

    async def update_geotag(
        self,
        geotag: Geotag,
        form: GeotagUpdateForm,
        media_files: Optional[List[str]] = [],
    ) -> Geotag:

        if not geotag:
            raise ValueError("Геометка не найдена!")
        
        geotag.title = form.title
        geotag.text = form.text
        geotag.latitude = form.latitude
        geotag.longitude = form.longitude
        geotag.warnings = form.warnings
        geotag.tips = form.tips

        validation_result = await self.yndx_gpt.validate_profanity_and_falsification(f"Название статьи: '{geotag.title}'. Координаты: latitude={geotag.latitude}, longitude={geotag.longitude}. Основной текст статьи: '{geotag.text}'. Текст раздела статьи с предупреждениями для путешественников: '{geotag.warnings}'. Текст раздела статьи с советами для путешественников: '{geotag.tips}'.")
        profanity, falsification = validation_result.json()["result"]["alternatives"][0]["message"]["text"].split(", ")
        print(profanity, falsification)
        if (profanity == "False" or profanity == "false") or (falsification == "False" or falsification == "false"):
            raise ValueError("Ваша статья содержит нецензурную лексику или ложные факты, которые могут ввести других пользователей в заблуждение. Исправьте статью и попробуйте еще раз.")
        elif (profanity == "True" or profanity == "true") and (falsification == "True" or falsification == "true"):
            pass
        else:
            print(f"[{datetime.datetime.now()}] При создании статьи c названием '{geotag.title}' не применилась валидация на нецензурную лексику и фальсификацию, т.к. ответ ИИ не соответствовал нужному формату. Требуется ручная модерация. Ответ: '{validation_result.json()["result"]["alternatives"][0]["message"]["text"]}'")
        
        
        if media_files != []:
            geotag.media_files = media_files
        
        current_theme_ids = {t.id for t in geotag.themes}
        new_theme_ids = set(form.theme_ids)
        
        # Удаляем лишние темы
        for theme_id in current_theme_ids - new_theme_ids:
            stmt = geotag_themes.delete().where(
                and_(
                    geotag_themes.c.geotag_id == geotag.id,
                    geotag_themes.c.theme_id == theme_id
                )
            )
            await self.db.execute(stmt)
        
        # Добавляем новые темы
        for theme_id in new_theme_ids - current_theme_ids:
            stmt = geotag_themes.insert().values(
                geotag_id=geotag.id,
                theme_id=theme_id
            )
            await self.db.execute(stmt)
        
        await self.db.commit()
        await self.db.refresh(geotag)
        return geotag

