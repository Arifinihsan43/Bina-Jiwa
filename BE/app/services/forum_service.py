from supabase import Client

from app.core.errors import forbidden, not_found, run


def _own_persona_id(client: Client, user_id: str, id_persona: str) -> None:
    result = run(
        client.table("personas")
        .select("id_persona")
        .eq("id_persona", id_persona)
        .eq("id_user", user_id)
        .maybe_single()
    )
    if not result.data:
        raise forbidden("Persona tidak valid atau bukan milik kamu")


# --- categories ---------------------------------------------------------

def list_categories(client: Client, only_active: bool) -> list[dict]:
    query = client.table("categories").select("*").order("nama_kategori")
    if only_active:
        query = query.eq("is_active", True)
    return run(query).data


def create_category(client: Client, payload: dict) -> dict:
    return run(client.table("categories").insert(payload).select("*")).data[0]


def update_category(client: Client, category_id: str, payload: dict) -> dict:
    result = run(
        client.table("categories").update(payload).eq("id_category", category_id).select("*")
    )
    if not result.data:
        raise not_found("Kategori tidak ditemukan")
    return result.data[0]


def delete_category(client: Client, category_id: str) -> None:
    result = run(
        client.table("categories").delete().eq("id_category", category_id).select("id_category")
    )
    if not result.data:
        raise not_found("Kategori tidak ditemukan")


# --- posts ---------------------------------------------------------------

def list_posts(
    client: Client, category_id: str | None, limit: int, offset: int
) -> list[dict]:
    query = client.table("posts").select("*").order("created_at", desc=True)
    if category_id:
        query = query.eq("id_category", category_id)
    return run(query.range(offset, offset + limit - 1)).data


def get_post(client: Client, post_id: str) -> dict:
    result = run(client.table("posts").select("*").eq("id_post", post_id).maybe_single())
    if not result.data:
        raise not_found("Post tidak ditemukan")
    return result.data


def create_post(client: Client, user_id: str, payload: dict) -> dict:
    _own_persona_id(client, user_id, payload["id_persona"])
    body = {**payload, "id_user": user_id}
    return run(client.table("posts").insert(body).select("*")).data[0]


def update_post(client: Client, post_id: str, payload: dict) -> dict:
    result = run(client.table("posts").update(payload).eq("id_post", post_id).select("*"))
    if not result.data:
        raise not_found("Post tidak ditemukan")
    return result.data[0]


# --- answers ---------------------------------------------------------------

def list_answers(client: Client, post_id: str, limit: int, offset: int) -> list[dict]:
    result = run(
        client.table("answers")
        .select("*")
        .eq("id_post", post_id)
        .order("created_at")
        .range(offset, offset + limit - 1)
    )
    return result.data


def create_answer(client: Client, user_id: str, post_id: str, payload: dict) -> dict:
    _own_persona_id(client, user_id, payload["id_persona"])
    body = {**payload, "id_user": user_id, "id_post": post_id}
    return run(client.table("answers").insert(body).select("*")).data[0]


def update_answer(client: Client, answer_id: str, payload: dict) -> dict:
    result = run(client.table("answers").update(payload).eq("id_answer", answer_id).select("*"))
    if not result.data:
        raise not_found("Jawaban tidak ditemukan")
    return result.data[0]


# --- answer comments ---------------------------------------------------------------

def list_comments(client: Client, answer_id: str, limit: int, offset: int) -> list[dict]:
    result = run(
        client.table("answer_comments")
        .select("*")
        .eq("id_answer", answer_id)
        .order("created_at")
        .range(offset, offset + limit - 1)
    )
    return result.data


def create_comment(client: Client, user_id: str, answer_id: str, payload: dict) -> dict:
    _own_persona_id(client, user_id, payload["id_persona"])
    body = {**payload, "id_user": user_id, "id_answer": answer_id}
    return run(client.table("answer_comments").insert(body).select("*")).data[0]


def update_comment(client: Client, comment_id: str, payload: dict) -> dict:
    result = run(
        client.table("answer_comments").update(payload).eq("id_comment", comment_id).select("*")
    )
    if not result.data:
        raise not_found("Komentar tidak ditemukan")
    return result.data[0]


# --- hugs ---------------------------------------------------------------

def toggle_post_hug(client: Client, user_id: str, post_id: str) -> bool:
    existing = run(
        client.table("post_hugs")
        .select("id_post")
        .eq("id_post", post_id)
        .eq("id_user", user_id)
        .maybe_single()
    )
    if existing.data:
        run(
            client.table("post_hugs")
            .delete()
            .eq("id_post", post_id)
            .eq("id_user", user_id)
        )
        return False
    run(client.table("post_hugs").insert({"id_post": post_id, "id_user": user_id}))
    return True


def toggle_answer_hug(client: Client, user_id: str, answer_id: str) -> bool:
    existing = run(
        client.table("answer_hugs")
        .select("id_answer")
        .eq("id_answer", answer_id)
        .eq("id_user", user_id)
        .maybe_single()
    )
    if existing.data:
        run(
            client.table("answer_hugs")
            .delete()
            .eq("id_answer", answer_id)
            .eq("id_user", user_id)
        )
        return False
    run(client.table("answer_hugs").insert({"id_answer": answer_id, "id_user": user_id}))
    return True
