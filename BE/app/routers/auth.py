from fastapi import APIRouter, Depends, status

from app.core.security import AuthContext, get_auth_context
from app.core.supabase_client import get_user_client
from app.schemas.auth import AuthSession, LoginRequest, RefreshRequest, RegisterRequest
from app.schemas.common import Message
from app.schemas.profile import ProfileOut
from app.services import auth_service, profile_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthSession, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> AuthSession:
    return auth_service.register(payload)


@router.post("/login", response_model=AuthSession)
def login(payload: LoginRequest) -> AuthSession:
    return auth_service.login(payload)


@router.post("/refresh", response_model=AuthSession)
def refresh(payload: RefreshRequest) -> AuthSession:
    return auth_service.refresh(payload)


@router.post("/logout", response_model=Message)
def logout(ctx: AuthContext = Depends(get_auth_context)) -> Message:
    auth_service.logout(ctx.access_token)
    return Message(message="Berhasil logout")


@router.get("/me", response_model=ProfileOut)
def me(ctx: AuthContext = Depends(get_auth_context)) -> ProfileOut:
    client = get_user_client(ctx.access_token)
    return profile_service.get_profile(client, ctx.user.id)
