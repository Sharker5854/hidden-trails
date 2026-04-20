from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.messages import Conversation, Message
from app.models.users import User
from app.schemas.messages import ConversationPublic, MessagePublic
from app.schemas.users import UserMiniPublic


class MessagesService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _conversation_pair(self, user_id: int, partner_id: int) -> tuple[int, int]:
        return tuple(sorted((user_id, partner_id)))

    def _message_public(self, message: Message, current_user_id: int) -> MessagePublic:
        return MessagePublic(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            recipient_id=message.recipient_id,
            text=message.text,
            created_at=message.created_at,
            is_read=message.is_read,
            is_mine=message.sender_id == current_user_id,
        )

    async def _get_user_or_404(self, user_id: int) -> User:
        user = await self.db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return user

    async def _get_conversation_for_user(
        self,
        conversation_id: int,
        current_user_id: int,
    ) -> Conversation:
        stmt = (
            select(Conversation)
            .options(
                selectinload(Conversation.user_one),
                selectinload(Conversation.user_two),
            )
            .where(
                Conversation.id == conversation_id,
                or_(
                    Conversation.user_one_id == current_user_id,
                    Conversation.user_two_id == current_user_id,
                ),
            )
        )
        result = await self.db.execute(stmt)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        return conversation

    async def get_or_create_conversation(
        self,
        current_user_id: int,
        partner_id: int,
    ) -> Conversation:
        if current_user_id == partner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot message yourself.",
            )

        await self._get_user_or_404(partner_id)
        user_one_id, user_two_id = self._conversation_pair(current_user_id, partner_id)

        stmt = (
            select(Conversation)
            .options(
                selectinload(Conversation.user_one),
                selectinload(Conversation.user_two),
            )
            .where(
                Conversation.user_one_id == user_one_id,
                Conversation.user_two_id == user_two_id,
            )
        )
        result = await self.db.execute(stmt)
        conversation = result.scalar_one_or_none()
        if conversation:
            return conversation

        conversation = Conversation(
            user_one_id=user_one_id,
            user_two_id=user_two_id,
            updated_at=datetime.utcnow(),
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return await self._get_conversation_for_user(conversation.id, current_user_id)

    async def send_message(
        self,
        sender_id: int,
        recipient_id: int,
        text: str,
    ) -> MessagePublic:
        normalized_text = text.strip()
        if not normalized_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message text is required.",
            )

        conversation = await self.get_or_create_conversation(sender_id, recipient_id)
        message = Message(
            conversation_id=conversation.id,
            sender_id=sender_id,
            recipient_id=recipient_id,
            text=normalized_text,
        )
        conversation.updated_at = datetime.utcnow()

        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return self._message_public(message, sender_id)

    async def list_conversations(self, current_user_id: int) -> List[ConversationPublic]:
        stmt = (
            select(Conversation)
            .options(
                selectinload(Conversation.user_one),
                selectinload(Conversation.user_two),
            )
            .where(
                or_(
                    Conversation.user_one_id == current_user_id,
                    Conversation.user_two_id == current_user_id,
                )
            )
            .order_by(desc(Conversation.updated_at))
        )
        result = await self.db.execute(stmt)
        conversations = result.scalars().all()
        conversation_items: List[ConversationPublic] = []

        for conversation in conversations:
            partner = (
                conversation.user_two
                if conversation.user_one_id == current_user_id
                else conversation.user_one
            )

            last_message_stmt = (
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(desc(Message.created_at))
                .limit(1)
            )
            last_message_result = await self.db.execute(last_message_stmt)
            last_message = last_message_result.scalar_one_or_none()

            unread_stmt = select(func.count(Message.id)).where(
                Message.conversation_id == conversation.id,
                Message.recipient_id == current_user_id,
                Message.is_read.is_(False),
            )
            unread_result = await self.db.execute(unread_stmt)

            conversation_items.append(
                ConversationPublic(
                    id=conversation.id,
                    partner=UserMiniPublic.model_validate(partner),
                    last_message=(
                        self._message_public(last_message, current_user_id)
                        if last_message
                        else None
                    ),
                    unread_count=int(unread_result.scalar_one() or 0),
                    updated_at=conversation.updated_at,
                )
            )

        return conversation_items

    async def list_messages(
        self,
        conversation_id: int,
        current_user_id: int,
    ) -> List[MessagePublic]:
        await self._get_conversation_for_user(conversation_id, current_user_id)

        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        result = await self.db.execute(stmt)
        messages = result.scalars().all()

        for message in messages:
            if message.recipient_id == current_user_id:
                message.is_read = True

        await self.db.execute(
            update(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.recipient_id == current_user_id,
                Message.is_read.is_(False),
            )
            .values(is_read=True)
        )
        await self.db.commit()

        return [self._message_public(message, current_user_id) for message in messages]
