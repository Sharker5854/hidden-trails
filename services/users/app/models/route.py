from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base
from datetime import datetime


class Route(Base):
    __tablename__ = "routes"
    
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )

    title: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    warnings: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )

    tips: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )


    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author: Mapped["User"] = relationship(back_populates="routes")

    themes: Mapped[list["Theme"]] = relationship(
        secondary="route_themes",
        back_populates="routes",
    )

    start_point_id: Mapped[int] = mapped_column(
        ForeignKey("geotags.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    start_point: Mapped["Geotag"] = relationship(
        foreign_keys=[start_point_id]
    )

    finish_point_id: Mapped[int] = mapped_column(
        ForeignKey("geotags.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    finish_point: Mapped["Geotag"] = relationship(
        foreign_keys=[finish_point_id]
    )

    geotags: Mapped[list["Geotag"]] = relationship(
        secondary="route_geotags",
        back_populates="routes",
    )

    transport_type: Mapped[str] = mapped_column(
        String(50),
        nullable=True,
    )

    distance_km: Mapped[float] = mapped_column(
        Float,
        nullable=True,
    )

    travel_time_min: Mapped[int] = mapped_column(
        Integer,
        nullable=True,
    )

    total_visit_time_min: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # список точек (lon, lat), по которым прокладывается маршрут
    route_points: Mapped[List[List[float]]] = mapped_column(
        JSONB, 
        nullable=False, 
        default=[]
    )