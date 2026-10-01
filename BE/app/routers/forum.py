from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client
from app.schemas.forum import (
    AnswerCreate,
    AnswerOut,
    AnswerUpdate,
    CategoryOut,
    CommentCreate,
    CommentOut,
    CommentUpdate,
    FeedSort,
    ForumStats,
    HugResult,
    PostCreate,
    PostOut,
    PostUpdate,
)
from app.services import forum_service

# Kategori dikelola lewat Panel Admin (/admin/categories).
router = APIRouter(prefix="/forum", tags=["forum"])


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(client: Client = Depends(get_scoped_client)) -> list[CategoryOut]:
    return forum_service.list_categories(client, only_active=True)


@router.get("/stats", response_model=ForumStats)
def get_stats(client: Client = Depends(get_scoped_client)) -> ForumStats:
    return forum_service.get_stats(client)


# --- posts ---------------------------------------------------------------

@router.get("/posts", response_model=list[PostOut])
def list_posts(
    category_id: str | None = None,
    sort: FeedSort = "terbaru",
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[PostOut]:
    return forum_service.list_posts(client, current_user.id, category_id, sort, limit, offset)


@router.post("/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PostOut:
    return forum_service.create_post(client, current_user.id, payload.model_dump(mode="json"))


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PostOut:
    return forum_service.get_post(client, current_user.id, post_id)


@router.patch("/posts/{post_id}", response_model=PostOut)
def update_post(
    post_id: str,
    payload: PostUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PostOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return forum_service.update_post(client, current_user.id, post_id, body)


@router.post("/posts/{post_id}/hug", response_model=HugResult)
def toggle_post_hug(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> HugResult:
    return forum_service.toggle_post_hug(client, current_user.id, post_id)


# --- answers ---------------------------------------------------------------

@router.get("/posts/{post_id}/answers", response_model=list[AnswerOut])
def list_answers(
    post_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[AnswerOut]:
    return forum_service.list_answers(client, current_user.id, post_id, limit, offset)


@router.post(
    "/posts/{post_id}/answers", response_model=AnswerOut, status_code=status.HTTP_201_CREATED
)
def create_answer(
    post_id: str,
    payload: AnswerCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> AnswerOut:
    return forum_service.create_answer(client, current_user.id, post_id, payload.model_dump(mode="json"))


@router.patch("/answers/{answer_id}", response_model=AnswerOut)
def update_answer(
    answer_id: str,
    payload: AnswerUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> AnswerOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return forum_service.update_answer(client, current_user.id, answer_id, body)


@router.post("/answers/{answer_id}/hug", response_model=HugResult)
def toggle_answer_hug(
    answer_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> HugResult:
    return forum_service.toggle_answer_hug(client, current_user.id, answer_id)


# --- answer comments ---------------------------------------------------------------

@router.get("/answers/{answer_id}/comments", response_model=list[CommentOut])
def list_comments(
    answer_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[CommentOut]:
    return forum_service.list_comments(client, current_user.id, answer_id, limit, offset)


@router.post(
    "/answers/{answer_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED
)
def create_comment(
    answer_id: str,
    payload: CommentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> CommentOut:
    return forum_service.create_comment(client, current_user.id, answer_id, payload.model_dump(mode="json"))


@router.patch("/comments/{comment_id}", response_model=CommentOut)
def update_comment(
    comment_id: str,
    payload: CommentUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> CommentOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return forum_service.update_comment(client, current_user.id, comment_id, body)
