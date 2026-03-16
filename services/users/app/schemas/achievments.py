from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator




class AchievmentsCreate(BaseModel):
    title: str
    
    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v:
            raise ValueError("Название достижения не может быть пустым!")
        if not (3 <= len(str(v)) <= 100):
            raise ValueError("Название достижения должно быть от 3 до 100 символов!")
        return v