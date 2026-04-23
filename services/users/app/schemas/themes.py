from pydantic import BaseModel, field_validator



class ThemePublic(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class ThemesCreateUpdate(BaseModel):
    name: str
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v:
            raise ValueError("Название темы не может быть пустым!")
        if not (2 <= len(str(v)) <= 100):
            raise ValueError("Название темы должно быть от 2 до 100 символов!")
        return v