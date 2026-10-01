from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PostStatus = Literal["PUBLISHED", "HIDDEN", "DELETED"]
FeedSort = Literal["terbaru", "populer"]

# Catatan anonimitas: output forum TIDAK menyertakan id_user penulis.
# Yang ditampilkan hanya persona + penanda `milik_saya` / `oleh_psikolog`.


class CategoryCreate(BaseModel):
    nama_kategori: str = Field(min_length=1, max_length=50)
    slug: str | None = Field(default=None, min_length=1, max_length=60, pattern=r"^[a-z0-9-]+$")
    deskripsi: str | None = Field(default=None, max_length=500)


class CategoryUpdate(BaseModel):
    nama_kategori: str | None = Field(default=None, min_length=1, max_length=50)
    slug: str | None = Field(default=None, min_length=1, max_length=60, pattern=r"^[a-z0-9-]+$")
    deskripsi: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None


class CategoryOut(BaseModel):
    id_category: str
    nama_kategori: str
    slug: str
    deskripsi: str | None = None
    is_active: bool
    created_at: datetime


class PersonaInfo(BaseModel):
    id_persona: str
    nama_persona: str
    foto_persona: str | None = None


class CategoryInfo(BaseModel):
    id_category: str
    nama_kategori: str
    slug: str


# --- posts -------------------------------------------------------------------

class PostCreate(BaseModel):
    # Persona diambil otomatis dari persona milik user.
    id_category: str | None = None
    judul: str | None = Field(default=None, max_length=200)
    isi: str = Field(min_length=1, max_length=5000)


class PostUpdate(BaseModel):
    id_category: str | None = None
    judul: str | None = Field(default=None, min_length=1, max_length=200)
    isi: str | None = Field(default=None, min_length=1, max_length=5000)
    # Pemilik hanya boleh menghapus; menyembunyikan adalah wewenang moderator.
    status: Literal["DELETED"] | None = None


class TopAnswerInfo(BaseModel):
    id_answer: str
    persona: PersonaInfo | None = None
    isi: str
    jumlah_peluk: int
    oleh_psikolog: bool = False
    created_at: datetime


class PostOut(BaseModel):
    id_post: str
    id_category: str | None = None
    judul: str
    isi: str
    status: PostStatus
    persona: PersonaInfo | None = None
    kategori: CategoryInfo | None = None
    milik_saya: bool = False
    jumlah_peluk: int = 0
    sudah_dipeluk: bool = False
    jumlah_balasan: int = 0
    balasan_teratas: TopAnswerInfo | None = None
    created_at: datetime
    updated_at: datetime


# --- answers -----------------------------------------------------------------

class AnswerCreate(BaseModel):
    isi: str = Field(min_length=1, max_length=3000)


class AnswerUpdate(BaseModel):
    isi: str | None = Field(default=None, min_length=1, max_length=3000)
    status: Literal["DELETED"] | None = None


class AnswerOut(BaseModel):
    id_answer: str
    id_post: str
    isi: str
    status: PostStatus
    persona: PersonaInfo | None = None
    milik_saya: bool = False
    oleh_psikolog: bool = False
    jumlah_peluk: int = 0
    sudah_dipeluk: bool = False
    jumlah_komentar: int = 0
    created_at: datetime
    updated_at: datetime


# --- answer comments ---------------------------------------------------------

class CommentCreate(BaseModel):
    isi: str = Field(min_length=1, max_length=1000)


class CommentUpdate(BaseModel):
    isi: str | None = Field(default=None, min_length=1, max_length=1000)
    status: Literal["DELETED"] | None = None


class CommentOut(BaseModel):
    id_comment: str
    id_answer: str
    isi: str
    status: PostStatus
    persona: PersonaInfo | None = None
    milik_saya: bool = False
    oleh_psikolog: bool = False
    created_at: datetime
    updated_at: datetime


class ForumStats(BaseModel):
    jumlah_anggota: int
    jumlah_cerita: int


class HugResult(BaseModel):
    dipeluk: bool
    jumlah_peluk: int
