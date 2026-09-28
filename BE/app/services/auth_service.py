from supabase_auth.types import AuthResponse, User

from app.core.config import get_settings
from app.core.errors import bad_request, run_auth
from app.core.supabase_client import get_anon_client, get_service_client
from app.schemas.auth import AuthSession, AuthUser, LoginRequest, RefreshRequest, RegisterRequest


def _to_auth_user(user: User) -> AuthUser:
    return AuthUser(id=user.id, email=user.email, email_confirmed=bool(user.email_confirmed_at))


def _to_session(response: AuthResponse) -> AuthSession:
    session = response.session
    return AuthSession(
        access_token=session.access_token if session else None,
        refresh_token=session.refresh_token if session else None,
        expires_in=session.expires_in if session else None,
        token_type=session.token_type if session else None,
        user=_to_auth_user(response.user),
        needs_email_confirmation=session is None,
    )


def register(payload: RegisterRequest) -> AuthSession:
    client = get_anon_client()
    response = run_auth(
        client.auth.sign_up,
        {
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "nama_lengkap": payload.nama_lengkap,
                    "username": payload.username,
                    "role": payload.role,
                }
            },
        },
    )
    if response.user is None:
        raise bad_request("Registrasi gagal")
    return _to_session(response)


def login(payload: LoginRequest) -> AuthSession:
    client = get_anon_client()
    response = run_auth(
        client.auth.sign_in_with_password,
        {"email": payload.email, "password": payload.password},
    )
    return _to_session(response)


def refresh(payload: RefreshRequest) -> AuthSession:
    client = get_anon_client()
    response = run_auth(client.auth.refresh_session, payload.refresh_token)
    return _to_session(response)


def logout(access_token: str) -> None:
    settings = get_settings()
    if not settings.has_service_role:
        return
    run_auth(get_service_client().auth.admin.sign_out, access_token, "local")
