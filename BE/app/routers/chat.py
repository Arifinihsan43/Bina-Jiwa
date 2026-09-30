from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client
from app.schemas.chat import ConversationOut, MessageCreate, MessageOut
from app.schemas.common import Message
from app.services import chat_service

# Tidak ada endpoint "buat percakapan": percakapan user <-> psikolog dibuat
# otomatis saat psikolog mengonfirmasi janji temu.
router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[ConversationOut]:
    return chat_service.list_conversations(client, current_user.id, limit, offset)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(
    conversation_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[MessageOut]:
    return chat_service.list_messages(client, conversation_id, limit, offset)


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    conversation_id: str,
    payload: MessageCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> MessageOut:
    body = payload.model_dump(mode="json")
    return chat_service.send_message(client, current_user.id, conversation_id, body)


@router.patch("/conversations/{conversation_id}/messages/read", response_model=Message)
def mark_read(
    conversation_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> Message:
    chat_service.mark_conversation_read(client, current_user.id, conversation_id)
    return Message(message="Pesan ditandai sudah dibaca")
