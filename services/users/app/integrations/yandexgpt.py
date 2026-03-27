import pprint
import json
from fastapi import HTTPException
from .utils import HttpxClient
from app.core.config import settings


class YandexGPT:
    def __init__(self):
        self.__api_key = settings.yandex_cloud_api_key
        self.__folder_id = settings.yandex_cloud_folder_id
        self._model = "yandexgpt-lite"
        self.httpx_client = HttpxClient(host="https://llm.api.cloud.yandex.net")

    def _request_headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.__api_key}"
        }
    
    def _model_uri(self) -> str:
        return f"gpt://{self.__folder_id}/{self._model}"
    

    async def send_request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ):
        try:
            async with self.httpx_client as client:
                if method == "GET":
                    response = await client.get(
                        endpoint,
                        **kwargs
                    )
                    return response
                elif method == "POST":
                    response = await client.post(
                        endpoint,
                        **kwargs
                    )
                    return response
                else:
                    raise ValueError(f"Method '{method}' is incorrect. Must be 'GET' or 'POST'.")
        except Exception as e:
            raise e


    async def validate_profanity_and_falsification(
            self, 
            text: str, 
            model_temperature: float = 0.1,
            max_output_tokens: int = 500
        ) -> bool:
        payload = {
            "modelUri": self._model_uri(),
            "completionOptions": {
                "stream": False,
                "temperature": model_temperature,
                "max_tokens": max_output_tokens,
            },
            "messages": [
                {
                    "role": "system",
                    "text": """
                        Ты умный модератор тревел-приложения, в котором на интерактивной карте пользователи могут создавать геометки и прикреплять к ним самописные статьи с информацией об указанном месте.
                        Твоя задача распознавать две вещи: 
                        наличие в тексте ненормативной лексики в любом виде (включая завуалированные варианты вроде транслита, замены символов на схожие символы и на цифры),
                        а также распознавание в тексте откровенно неправдивой информации об указанных местах, вводящей в заблуждение (например, 'в африке очень холодно' или 'во второй мировой войне победила гитлеровская Германия'). 
                        Или информации неверной в общем историческом, географическом и прочих контекстах.
                        Если в фальсификации какой-то информации в статье ты не уверен на все 100%, (например, малоизвестный факт, локальные диалекты/мифы, либо же информация о будущем, которое еще не наступило) то воспринимай ее как заведомо нейтральную, и не считай ложью.
                        Точные координаты объекта, про который пишется статья геометки, тебе тоже будут переданы вместе с текстом.
                        В качестве ответа предоставляй короткую строку, состоящую лишь из двух слов через запятую с пробелом.
                        Первое слово: True, если в тексте отсутствует ненормативная лексика, и False - если присутствует.
                        Второе слово: True, если вся информация в тексте правдоподобна, и False - если есть фальсификация.
                    """             
                },
                # 1. ЕЩЕ НАДО ПРОВЕРЯТЬ СООТВЕТСТВИЕ ПЕРЕДАННЫХ КООРДИНАТ ТОМУ ОПИСАНИЮ ОБЪЕКТА, КОТОРЫЙ В СТАТЬЕ. Вдруг корды эйфелевой башни, а рассказывается про Тити-Каку
                # Также передавать название статьи и прочую инфу тоже для валидации
                # 2. То же самое для update-операции в service добавить
                # 3. Подумать и записать при каких еще будущих операциях по работе с геометками в системе эта валидация уместна будет
                {
                    "role": "user",
                    "text": f"""
                        Текст статьи и точные координаты геометки: 
                        {text}
                    """
                }
            ]
        }
        response = await self.send_request(
            "POST",
            "/foundationModels/v1/completion",
            json=payload,
            headers=self._request_headers()
        )
        if response.status_code != 200:
            failed_json = response.json()
            pprint.pprint(failed_json)
            raise HTTPException(
                status_code=int(failed_json["error"]["httpCode"]),
                detail=failed_json["error"]["message"]
            )
        return response