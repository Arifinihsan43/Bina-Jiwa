import uuid

from fastapi import HTTPException, status
from storage3.exceptions import StorageApiError

from app.core.errors import bad_request
from app.core.supabase_client import get_service_client

_BUCKET_RULES: dict[str, dict] = {
    "avatars": {"content_types": {"image/png", "image/jpeg", "image/webp"}, "max_bytes": 2_000_000},
    # Foto profil di halaman Pengaturan (bucket publik; URL disimpan di profiles.foto_profil).
    "profile-images": {"content_types": {"image/png", "image/jpeg", "image/webp"}, "max_bytes": 5_000_000},
    "personas": {"content_types": {"image/png", "image/jpeg", "image/webp"}, "max_bytes": 2_000_000},
    "events": {"content_types": {"image/png", "image/jpeg", "image/webp"}, "max_bytes": 5_000_000},
    "verification-docs": {
        "content_types": {"application/pdf", "image/png", "image/jpeg"},
        "max_bytes": 10_000_000,
    },
    "chat-attachments": {
        "content_types": {"image/png", "image/jpeg", "image/webp", "audio/mpeg", "audio/wav", "audio/webm"},
        "max_bytes": 15_000_000,
    },
}


def upload_file(bucket: str, user_id: str, filename: str, content: bytes, content_type: str) -> str:
    rules = _BUCKET_RULES.get(bucket)
    if rules is None:
        raise bad_request(f"Bucket '{bucket}' tidak dikenal. Pilihan: {', '.join(_BUCKET_RULES)}")
    if content_type not in rules["content_types"]:
        raise bad_request(f"Tipe file '{content_type}' tidak didukung untuk bucket '{bucket}'")
    if len(content) > rules["max_bytes"]:
        raise bad_request(f"Ukuran file melebihi batas {rules['max_bytes']} bytes")

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    path = f"{user_id}/{uuid.uuid4().hex}.{extension}"

    try:
        client = get_service_client()
        client.storage.from_(bucket).upload(
            path, content, file_options={"content-type": content_type}
        )
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    except StorageApiError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, exc.message) from exc

    return client.storage.from_(bucket).get_public_url(path)
