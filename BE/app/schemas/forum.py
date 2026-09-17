from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PostStatus = Literal["PUBLISHED", "HIDDEN", "DELETED"]


class CategoryCreate(BaseModel):
    nama_kategori: str = Field(min_length=1, max_length=50)
    slug: str = Field(min_length=1, max_length=60, pattern=r"^[a-z0-9-]+$")
    deskripsi: str | None = None


class CategoryUpdate(BaseModel):
    nama_kategori: str | None = Field(default=None, min_length=1, max_length=50)
    slug: str | None = Field(default=None, min_length=1, max_length=60, pattern=r"^[a-z0-9-]+$")
    deskripsi: str | None = None
    is_active: bool | None = None


class CategoryOut(BaseModel):
    id_category: str
    nama_kategori: str
    slug: str
    deskripsi: str | None = None
    is_active: bool
    created_at: datetime


class PostCreate(BaseModel):
    id_persona: str
    id_category: str | None = None
    judul: str = Field(min_length=1, max_length=200)
    isi: str = Field(min_length=1)


class PostUpdate(BaseModel):
    id_category: str | None = None
    judul: str | None = Field(default=None, min_length=1, max_length=200)
    isi: str | None = Field(default=None, min_length=1)
    status: PostStatus | None = None


class PostOut(BaseModel):
    id_post: str
    id_user: str
    id_persona: str
    id_category: str | None = None
    judul: str
    isi: str
    status: PostStatus
    created_at: datetime
    updated_at: datetime


class AnswerCreate(BaseModel):
    id_persona: str
    isi: str = Field(min_length=1)


class AnswerUpdate(BaseModel):
    isi: str | None = Field(default=None, min_length=1)
    status: PostStatus | None = None


class AnswerOut(BaseModel):
    id_answer: str
    id_post: str
    id_user: str
    id_persona: str
    isi: str
    status: PostStatus
    created_at: datetime
    updated_at: datetime


class CommentCreate(BaseModel):
    id_persona: str
    isi: str = Field(min_length=1)


class CommentUpdate(BaseModel):
    isi: str | None = Field(default=None, min_length=1)
    status: PostStatus | None = None


class CommentOut(BaseModel):
    id_comment: str
    id_answer: str
    id_user: str
    id_persona: str
    isi: str
    status: PostStatus
    created_at: datetime
    updated_at: datetime
