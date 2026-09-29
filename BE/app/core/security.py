import secrets
from functools import lru_cache

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel
from supabase import Client

from app.core.config import get_settings
from app.core.supabase_client import get_anon_client, get_service_client, get_user_client

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    email: str | None = None


class AuthContext(BaseModel):
    user: CurrentUser
    access_token: str


@lru_cache
def _jwks_client() -> PyJWKClient:
    settings = get_settings()
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True)


def _decode_local(token: str) -> dict:
    """Verifikasi token Supabase secara lokal (tanpa panggil Auth API tiap request).

    Project Supabase baru menandatangani JWT secara asimetris (ES256/RS256) dan
    kuncinya diambil dari JWKS endpoint; project lama masih pakai HS256 dengan
    shared secret (SUPABASE_JWT_SECRET). Deteksi otomatis dari header `alg`.
    """
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "")

    if alg.startswith("HS"):
        settings = get_settings()
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=[alg],
            audience="authenticated",
        )

    signing_key = _jwks_client().get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256", "RS256"],
        audience="authenticated",
    )


def _decode_remote(token: str) -> dict:
    response = get_anon_client().auth.get_user(token)
    if response is None or response.user is None:
        raise ValueError("Token tidak valid")
    return {"sub": response.user.id, "email": response.user.email}


async def get_auth_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthContext:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token akses tidak ditemukan")

    token = credentials.credentials
    try:
        payload = _decode_local(token)
    except Exception:
        try:
            payload = _decode_remote(token)
        except Exception as exc:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, "Token tidak valid atau kedaluwarsa"
            ) from exc

    return AuthContext(
        user=CurrentUser(id=payload["sub"], email=payload.get("email")),
        access_token=token,
    )


async def get_current_user(ctx: AuthContext = Depends(get_auth_context)) -> CurrentUser:
    return ctx.user


def get_scoped_client(ctx: AuthContext = Depends(get_auth_context)) -> Client:
    return get_user_client(ctx.access_token)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser | None:
    if credentials is None or not credentials.credentials:
        return None
    try:
        ctx = await get_auth_context(credentials)
    except HTTPException:
        return None
    return ctx.user


def require_admin_key(x_admin_key: str | None = Header(default=None)) -> Client:
    """Akses panel admin dengan kode akses (tanpa akun). Mengembalikan service client.

    Kode disimpan di ADMIN_ACCESS_KEY (.env backend) dan dikirim FE lewat header
    `X-Admin-Key`. Endpoint admin nonaktif selama variabel ini belum diisi.
    """
    settings = get_settings()
    if not settings.admin_access_key:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Panel admin belum diaktifkan (ADMIN_ACCESS_KEY kosong)"
        )
    if not x_admin_key or not secrets.compare_digest(
        x_admin_key.encode(), settings.admin_access_key.encode()
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Kode akses admin salah")
    return get_service_client()


async def require_admin(
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> CurrentUser:
    result = (
        client.table("profiles")
        .select("role")
        .eq("id_user", current_user.id)
        .maybe_single()
        .execute()
    )
    role = (result.data or {}).get("role") if result else None
    if role != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Butuh akses admin")
    return current_user
