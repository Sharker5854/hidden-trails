import datetime
import re
from fastapi import HTTPException, status
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, case, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User
from app.models.themes import Theme
from app.models.geotags import Geotag
from app.services.users import UsersService
from app.models.geotag_themes import geotag_themes
from app.schemas.geotags import GeotagCreateForm, GeotagPublic, GeotagUpdateForm
from app.integrations.yandexgpt import YandexGPT



class GeotagsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.yndx_gpt = YandexGPT()

    def _extract_moderation_text(self, validation_result) -> str:
        try:
            return (
                validation_result.json()["result"]["alternatives"][0]["message"]["text"]
                or ""
            ).strip()
        except (KeyError, IndexError, TypeError, AttributeError):
            return ""

    def _moderation_allows(self, validation_result, title: str) -> bool:
        moderation_text = self._extract_moderation_text(validation_result)
        bool_tokens = re.findall(r"\b(true|false)\b", moderation_text, flags=re.IGNORECASE)

        if len(bool_tokens) < 2:
            print(
                f"[{datetime.datetime.now()}] Moderation skipped for geotag "
                f"'{title}': unexpected response '{moderation_text}'"
            )
            return True

        profanity_ok, facts_ok = [token.lower() == "true" for token in bool_tokens[:2]]
        return profanity_ok and facts_ok


    async def get_by_id(self, geotag_id: int) -> Optional[Geotag]:
        stmt = (
            select(Geotag)
            .options(
                selectinload(Geotag.themes),
                selectinload(Geotag.author),
                selectinload(Geotag.likers),
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
            views_count=0,
        )

        validation_result = await self.yndx_gpt.validate_profanity_and_falsification(f"Название статьи: '{geotag.title}'.  Координаты: latitude={geotag.latitude}, longitude={geotag.longitude}. Основной текст статьи: '{geotag.text}'. Текст раздела статьи с предупреждениями для путешественников: '{geotag.warnings}'. Текст раздела статьи с советами для путешественников: '{geotag.tips}'.")
        if not self._moderation_allows(validation_result, geotag.title):
            raise ValueError("Ваша статья содержит нецензурную лексику или ложные факты, которые могут ввести других пользователей в заблуждение. Исправьте статью и попробуйте еще раз.")
        
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
    

    async def get_geotag_public(
        self,
        geotag_id: int,
        increment_view: bool = False,
        current_user_id: Optional[int] = None,
    ) -> Optional[GeotagPublic]:
        geotag = await self.get_by_id(geotag_id)
        if not geotag:
            return None

        if increment_view:
            geotag.views_count += 1
            await UsersService(self.db).recalculate_user_rating(geotag.author_id)
            await self.db.commit()
            geotag = await self.get_by_id(geotag_id)

        return GeotagPublic.from_orm(geotag, current_user_id=current_user_id)
    

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
        if not self._moderation_allows(validation_result, geotag.title):
            raise ValueError("Ваша статья содержит нецензурную лексику или ложные факты, которые могут ввести других пользователей в заблуждение. Исправьте статью и попробуйте еще раз.")
        
        
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
    


    async def save_geotag(
        self,
        user_id: int,
        geotag_id: int,
    ) -> dict:
        
        stmt = select(User).options(
            selectinload(User.saved_geotags)
        ).where(User.id == user_id)
        
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found.")
        
        stmt = select(Geotag).where(Geotag.id == geotag_id)
        result = await self.db.execute(stmt)
        geotag = result.scalar_one_or_none()
        
        if not geotag:
            raise HTTPException(status_code=404, detail=f"Geotag {geotag_id} not found.")
        
        if geotag in user.saved_geotags:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Geotag already saved"
            )
        
        user.saved_geotags.append(geotag)
        await self.db.commit()
        await self.db.refresh(user)
        
        return {
            "status": "saved",
            "geotag_id": geotag_id,
            "user_id": user_id,
        }
    

    async def unsave_geotag(
        self,
        user_id: int,
        geotag_id: int,
    ) -> dict:
        
        stmt = select(User).options(
            selectinload(User.saved_geotags)
        ).where(User.id == user_id)
        
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found.")
        
        stmt = select(Geotag).where(Geotag.id == geotag_id)
        result = await self.db.execute(stmt)
        geotag = result.scalar_one_or_none()
        
        if not geotag:
            raise HTTPException(status_code=404, detail=f"Geotag {geotag_id} not found.")
        
        if geotag not in user.saved_geotags:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Geotag not in saved"
            )
        
        user.saved_geotags.remove(geotag)
        await self.db.commit()
        
        return {
            "status": "unsaved",
            "geotag_id": geotag_id,
            "user_id": user_id,
        }




    async def geotags_feed(
        self,
        user_id: int,
        limit: int = 20,
        following_since: Optional[datetime.datetime] = None,
    ) -> List[Geotag]:
        
        user_stmt = select(User).options(
            selectinload(User.following),
            selectinload(User.themes)
        ).where(User.id == user_id)
        
        result = await self.db.execute(user_stmt)
        user = result.scalar_one_or_none()
        
        following_ids = [u.id for u in getattr(user, 'following', [])]
        theme_ids = [t.id for t in getattr(user, 'themes', [])]
        
        main_priority = case(
            (Geotag.author_id.in_(following_ids), 3), # приоритетней всего геометки тех, на кого подписан
            (Geotag.themes.any(Theme.id.in_(theme_ids)), 2), # затем те геометки, тематика которых совпадает с интересами
            else_=1  # остальные отсортированные по времени публикации и кол-ву лайков
        )
        
        theme_bonus = case(
            # Если геотег от подписки И совпадает с темами — бонус к приоритетности
            (and_(Geotag.author_id.in_(following_ids), 
                Geotag.themes.any(Theme.id.in_(theme_ids))), 1),
            else_=0
        )

        # минус приоритет, если статья написана самим текущим пользователем
        own_articles_penalty = case(
            (Geotag.author_id == user_id, -1_000_000),
            else_=0
        )

        followed_new_bonus = case(
            (
                and_(
                    Geotag.author_id.in_(following_ids),
                    Geotag.created_at > following_since
                ),
                5_000_000
            ),
            else_=0
        ) if following_since else 0
        
        stmt = select(Geotag).options(
            selectinload(Geotag.author),
            selectinload(Geotag.themes),
            selectinload(Geotag.comments),
            selectinload(Geotag.likers),
        ).order_by(
            desc(
                followed_new_bonus
                + (main_priority * 1_000_000)
                + (theme_bonus * 10_000)
                + own_articles_penalty
            ),
            Geotag.created_at.desc(),
            desc(Geotag.likes_count),
        ).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()
    


    async def like_geotag(
        self,
        user_id: int,
        geotag_id: int
    ) -> Dict[str, Any]:
        
        user_stmt = select(User).options(
            selectinload(User.liked_geotags)
        ).where(User.id == user_id)

        result = await self.db.execute(user_stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        
        geotag_stmt = select(Geotag).where(Geotag.id == geotag_id)
        result = await self.db.execute(geotag_stmt)
        geotag = result.scalar_one_or_none()
        
        if not geotag:
            raise HTTPException(status_code=404, detail="Geotag not found.")
        
        if geotag in user.liked_geotags:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already liked."
            )
        
        user.liked_geotags.append(geotag)
        geotag.likes_count += 1
        await UsersService(self.db).recalculate_user_rating(geotag.author_id)
        
        await self.db.commit()
        await self.db.refresh(geotag)
        
        return {
            "status": "liked",
            "user_id": user_id,
            "geotag_id": geotag_id,
            "total_likes": geotag.likes_count,
        }
    


    async def unlike_geotag(
        self,
        user_id: int,
        geotag_id: int
    ) -> Dict[str, Any]:
        
        user_stmt = select(User).options(
            selectinload(User.liked_geotags)
        ).where(User.id == user_id)

        result = await self.db.execute(user_stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        
        geotag_stmt = select(Geotag).where(Geotag.id == geotag_id)
        result = await self.db.execute(geotag_stmt)
        geotag = result.scalar_one_or_none()
        
        if not geotag:
            raise HTTPException(status_code=404, detail="Geotag not found.")
        
        if geotag not in user.liked_geotags:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Already not liked."
            )
        
        user.liked_geotags.remove(geotag)
        geotag.likes_count -= 1
        await UsersService(self.db).recalculate_user_rating(geotag.author_id)
        
        await self.db.commit()
        await self.db.refresh(geotag)
        
        return {
            "status": "unliked",
            "user_id": user_id,
            "geotag_id": geotag_id,
            "total_likes": geotag.likes_count,
        }
