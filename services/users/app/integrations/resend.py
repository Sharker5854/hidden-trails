from typing import Dict, Any
import resend
from fastapi import HTTPException
from app.core.config import settings



class Resend:
    def __init__(self):
        self.__api_key = settings.resend_api_key


    async def send_reset_password_email(
        self,
        email: str,
        reset_url: str,
        user_nickname: str
    ) -> Dict[str, Any]:

        email_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Сброс пароля</h2>
            <p>Приветствуем, <strong>{user_nickname}</strong>!</p>
            <p>Вы запросили сброс пароля. Перейдите по ссылке ниже:</p>
            <a href="{reset_url}" 
            style="background: #19242F; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
                {reset_url}
            </a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                Ссылка действительна <strong>30 минут</strong>.<br>
                Если вы не запрашивали сброс пароля — игнорируйте это письмо.
            </p>
        </div>
        """
        
        try:
            resend.api_key = self.__api_key
            result = resend.Emails.send({
                "from": "no-reply@resend.dev",
                "to": email,
                "subject": "Сброс пароля • Hidden Trails",
                "html": email_html,
            })
            return {
                "status": "sent",
                "email": email,
                "message_id": result["id"]
            }
        except Exception as e:
            raise HTTPException(500, f"Email send failed: {str(e)}")