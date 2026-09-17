from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client, require_admin
from app.schemas.forum import (
    AnswerCreate,
    AnswerOut,
    AnswerUpdate,
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    CommentCreate,
    CommentOut,
    CommentUpdate,
    PostCreate,
    PostOut,
    PostUpdate,
)
from app.services import forum_service

router = APIRouter(prefix="/forum", tags=["forum"])


# --- categories ---------------------------------------------------------

@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    only_active: bool = Query(default=True),
    client: Client = Depends(get_scoped_client),
) -> list[CategoryOut]:
    return forum_service.list_categories(client, only_active)


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    _: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> CategoryOut:
    return forum_service.create_category(client, payload.model_dump(mode="json"))


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    _: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> CategoryOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return forum_service.update_category(client, category_id, body)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: str,
    _: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> None:
    forum_service.delete_category(client, category_id)


# --- posts ---------------------------------------------------------------

@router.get("/posts", response_model=list[PostOut])
def list_posts(
    category_id: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[PostOut]:
    return forum_service.list_posts(client, category_id, limit, offset)


@router.post("/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PostOut:
    return forum_service.create_post(client, current_user.id, payload.model_dump(mode="json"))


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(post_id: str, client: Client = Depends(get_scoped_client)) -> PostOut:
    return forum_service.get_post(client, post_id)


@router.patch("/posts/{post_id}", response_model=PostOut)
def update_post(
    post_id: str,
    payload: PostUpdate,
    client: Client = Depends(get_scoped_client),
) -> PostOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return forum_service.update_post(client, post_id, body)


@router.post("/posts/{post_id}/hug")
def toggle_post_hug(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> dict:
    hugged = forum_service.toggle_post_hug(client, current_user.id, post_id)
    return {"hugged": hugged}


# --- answers ---------------------------------------------------------------

@router.get("/posts/{post_id}/answers", response_model=list[AnswerOut])
def list_answers(
    post_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[AnswerOut]:
    return forum_service.list_answers(client, post_id, limit, offset)


@router.post(
    "/posts/{post_id}/answers", response_model=AnswerOut, status_code=status.HTTP_201_CREATED
)
def create_answer(
    post_id: str,
    payload: AnswerCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> AnswerOut:
    return forum_service.create_answer(
        client, current_user.id, post_id, payload.model_dump(mode="json")
    )


@router.patch("/answers/{answer_id}", response_model=AnswerOut)
def update_answer(
    answer_id: str,
    payload: AnswerUpdate,
    client: Client = Depends(get_scoped_client),
) -> AnswerOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return forum_service.update_answer(client, answer_id, body)


@router.post("/answers/{answer_id}/hug")
def toggle_answer_hug(
    answer_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> dict:
    hugged = forum_service.toggle_answer_hug(client, current_user.id, answer_id)
    return {"hugged": hugged}


# --- answer comments ---------------------------------------------------------------

@router.get("/answers/{answer_id}/comments", response_model=list[CommentOut])
def list_comments(
    answer_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[CommentOut]:
    return forum_service.list_comments(client, answer_id, limit, offset)


@router.post(
    "/answers/{answer_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED
)
def create_comment(
    answer_id: str,
    payload: CommentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> CommentOut:
    return forum_service.create_comment(
        client, current_user.id, answer_id, payload.model_dump(mode="json")
    )


@router.patch("/comments/{comment_id}", response_model=CommentOut)
def update_comment(
    comment_id: str,
    payload: CommentUpdate,
    client: Client = Depends(get_scoped_client),
) -> CommentOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return forum_service.update_comment(client, comment_id, body)
