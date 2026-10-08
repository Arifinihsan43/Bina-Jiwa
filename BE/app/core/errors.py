from types import SimpleNamespace
from typing import Any

from fastapi import HTTPException, status
from postgrest.exceptions import APIError
from supabase_auth.errors import AuthApiError

_POSTGRES_CODE_MAP: dict[str, int] = {
    "23505": status.HTTP_409_CONFLICT,  # unique_violation
    "23503": status.HTTP_409_CONFLICT,  # foreign_key_violation
    "23P01": status.HTTP_409_CONFLICT,  # exclusion_violation (mis. jadwal appointment bentrok)
    "23514": status.HTTP_422_UNPROCESSABLE_ENTITY,  # check_violation
    "23502": status.HTTP_422_UNPROCESSABLE_ENTITY,  # not_null_violation
    "42501": status.HTTP_403_FORBIDDEN,  # insufficient_privilege (RLS)
    "P0002": status.HTTP_404_NOT_FOUND,  # no_data_found (raise dari fungsi SQL)
    "PGRST116": status.HTTP_404_NOT_FOUND,  # 0 rows for single()
    "PGRST204": status.HTTP_404_NOT_FOUND,
}


def run(query) -> Any:
    """Eksekusi query supabase-py dan ubah error jadi HTTPException yang rapi.

    `.maybe_single()` mengembalikan `None` (bukan objek ber-atribut `.data`) saat
    0 baris ditemukan — dinormalisasi di sini supaya semua caller bisa selalu
    mengakses `result.data` dengan aman.
    """
    try:
        response = query.execute()
    except APIError as exc:
        status_code = _POSTGRES_CODE_MAP.get(exc.code, status.HTTP_400_BAD_REQUEST)
        raise HTTPException(status_code=status_code, detail=exc.message) from exc
    if response is None:
        return SimpleNamespace(data=None, count=None)
    return response


def run_auth(fn, *args, **kwargs) -> Any:
    """Panggil method supabase auth dan ubah AuthApiError jadi HTTPException."""
    try:
        return fn(*args, **kwargs)
    except AuthApiError as exc:
        raise HTTPException(status_code=exc.status or status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc


def not_found(detail: str = "Data tidak ditemukan") -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, detail)


def forbidden(detail: str = "Tidak diizinkan") -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, detail)


def bad_request(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_400_BAD_REQUEST, detail)
