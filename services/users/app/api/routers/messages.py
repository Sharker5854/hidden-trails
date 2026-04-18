from fastapi import APIRouter, Depends, Form
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.api.deps import get_current_user, get_messages_service
from app.models.users import User
from app.services.messages import MessagesService


router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations")
async def list_conversations(
    user: User = Depends(get_current_user),
    messages_svc: MessagesService = Depends(get_messages_service),
):
    conversations = await messages_svc.list_conversations(user.id)
    return JSONResponse(
        status_code=200,
        content=jsonable_encoder({"conversations": conversations}),
    )


@router.get("/conversation/{conversation_id}")
async def list_messages(
    conversation_id: int,
    user: User = Depends(get_current_user),
    messages_svc: MessagesService = Depends(get_messages_service),
):
    messages = await messages_svc.list_messages(conversation_id, user.id)
    return JSONResponse(
        status_code=200,
        content=jsonable_encoder({"messages": messages}),
    )


@router.post("/send")
async def send_message(
    recipient_id: int = Form(..., ge=1),
    text: str = Form(..., min_length=1, max_length=4000),
    user: User = Depends(get_current_user),
    messages_svc: MessagesService = Depends(get_messages_service),
):
    message = await messages_svc.send_message(
        sender_id=user.id,
        recipient_id=recipient_id,
        text=text,
    )
    return JSONResponse(
        status_code=200,
        content=jsonable_encoder({"message": message}),
    )
