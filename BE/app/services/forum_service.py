import re
from datetime import datetime, timedelta, timezone

from supabase import Client

from app.core.errors import bad_request, forbidden, not_found, run

# Anonimitas: kolom id_user dibaca untuk menghitung `milik_saya` / `oleh_psikolog`,
# lalu dibuang sebelum dikirim ke klien (lihat _strip_user).

_PERSONA = "persona:personas(id_persona, nama_persona, foto_persona)"
_POST_SELECT = f"*, {_PERSONA}, kategori:categories(id_category, nama_kategori, slug)"
_ANSWER_SELECT = f"*, {_PERSONA}"
_COMMENT_SELECT = f"*, {_PERSONA}"

POPULAR_WINDOW_DAYS = 30
POPULAR_POOL = 200


def _strip_user(row: dict, user_id: str, psychologist_ids: set[str] | None = None) -> dict:
    owner = row.pop("id_user", None)
    row.pop("id_persona", None)
    row["milik_saya"] = owner == user_id
    if psychologist_ids is not None:
        row["oleh_psikolog"] = owner in psychologist_ids
    return row


def _verified_psychologists(client: Client, user_ids: set[str]) -> set[str]:
    """id_user yang merupakan psikolog terverifikasi (untuk lencana di balasan)."""
    if not user_ids:
        return set()
    rows = run(
        client.table("psychologists")
        .select("id_user")
        .in_("id_user", list(user_ids))
        .eq("verification_status", "VERIFIED")
    ).data
    return {r["id_user"] for r in rows}


def _own_persona(client: Client, user_id: str) -> dict:
    result = run(
        client.table("personas").select("id_persona, is_active").eq("id_user", user_id).maybe_single()
    )
    if not result.data:
        raise bad_request("Buat persona anonim terlebih dahulu sebelum berbagi di komunitas")
    if not result.data["is_active"]:
        raise forbidden("Persona kamu sedang dinonaktifkan")
    return result.data


def _count_by(rows: list[dict], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for r in rows:
        counts[r[key]] = counts.get(r[key], 0) + 1
    return counts


# --- categories ---------------------------------------------------------

def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:60] or "kategori"


def list_categories(client: Client, only_active: bool) -> list[dict]:
    query = client.table("categories").select("*").order("nama_kategori")
    if only_active:
        query = query.eq("is_active", True)
    return run(query).data


def create_category(client: Client, payload: dict) -> dict:
    body = {**payload, "slug": payload.get("slug") or slugify(payload["nama_kategori"])}
    return run(client.table("categories").insert(body).select("*")).data[0]


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


# --- stats ---------------------------------------------------------------

def get_stats(client: Client) -> dict:
    members = run(client.table("personas").select("id_persona", count="exact").limit(1))
    stories = run(
        client.table("posts").select("id_post", count="exact").eq("status", "PUBLISHED").limit(1)
    )
    return {"jumlah_anggota": members.count or 0, "jumlah_cerita": stories.count or 0}


# --- posts ---------------------------------------------------------------

def _enrich_posts(client: Client, user_id: str, posts: list[dict]) -> list[dict]:
    if not posts:
        return []
    post_ids = [p["id_post"] for p in posts]

    hugs = run(client.table("post_hugs").select("id_post, id_user").in_("id_post", post_ids)).data
    hug_counts = _count_by(hugs, "id_post")
    my_hugs = {h["id_post"] for h in hugs if h["id_user"] == user_id}

    answers = run(
        client.table("answers")
        .select(f"id_answer, id_post, id_user, isi, created_at, {_PERSONA}")
        .in_("id_post", post_ids)
        .eq("status", "PUBLISHED")
    ).data
    answer_counts = _count_by(answers, "id_post")

    # Balasan teratas = balasan dengan pelukan terbanyak (minimal 1) per post.
    top_by_post: dict[str, dict] = {}
    if answers:
        answer_hugs = run(
            client.table("answer_hugs")
            .select("id_answer")
            .in_("id_answer", [a["id_answer"] for a in answers])
        ).data
        answer_hug_counts = _count_by(answer_hugs, "id_answer")
        for a in answers:
            a["jumlah_peluk"] = answer_hug_counts.get(a["id_answer"], 0)
            best = top_by_post.get(a["id_post"])
            if a["jumlah_peluk"] > 0 and (best is None or a["jumlah_peluk"] > best["jumlah_peluk"]):
                top_by_post[a["id_post"]] = a
        psych = _verified_psychologists(client, {a["id_user"] for a in top_by_post.values()})
        for a in top_by_post.values():
            a["oleh_psikolog"] = a.pop("id_user") in psych
            a.pop("id_post", None)

    for p in posts:
        _strip_user(p, user_id)
        p["jumlah_peluk"] = hug_counts.get(p["id_post"], 0)
        p["sudah_dipeluk"] = p["id_post"] in my_hugs
        p["jumlah_balasan"] = answer_counts.get(p["id_post"], 0)
        p["balasan_teratas"] = top_by_post.get(p["id_post"])
    return posts


def list_posts(
    client: Client,
    user_id: str,
    category_id: str | None,
    sort: str,
    limit: int,
    offset: int,
) -> list[dict]:
    query = client.table("posts").select(_POST_SELECT).eq("status", "PUBLISHED")
    if category_id:
        query = query.eq("id_category", category_id)

    if sort == "populer":
        # Populer = pelukan + balasan terbanyak dari cerita 30 hari terakhir.
        since = (datetime.now(timezone.utc) - timedelta(days=POPULAR_WINDOW_DAYS)).isoformat()
        rows = run(
            query.gte("created_at", since).order("created_at", desc=True).limit(POPULAR_POOL)
        ).data
        rows = _enrich_posts(client, user_id, rows)
        rows.sort(key=lambda p: (p["jumlah_peluk"] + p["jumlah_balasan"], p["created_at"]), reverse=True)
        return rows[offset : offset + limit]

    rows = run(query.order("created_at", desc=True).range(offset, offset + limit - 1)).data
    return _enrich_posts(client, user_id, rows)


def _get_post_row(client: Client, post_id: str) -> dict:
    result = run(client.table("posts").select(_POST_SELECT).eq("id_post", post_id).maybe_single())
    if not result.data:
        raise not_found("Cerita tidak ditemukan")
    return result.data


def _require_published_post(client: Client, post_id: str) -> dict:
    post = _get_post_row(client, post_id)
    if post["status"] != "PUBLISHED":
        raise not_found("Cerita tidak ditemukan")
    return post


def get_post(client: Client, user_id: str, post_id: str) -> dict:
    return _enrich_posts(client, user_id, [_get_post_row(client, post_id)])[0]


def _check_category(client: Client, category_id: str | None) -> None:
    if not category_id:
        return
    result = run(
        client.table("categories")
        .select("id_category")
        .eq("id_category", category_id)
        .eq("is_active", True)
        .maybe_single()
    )
    if not result.data:
        raise bad_request("Kategori tidak tersedia")


def create_post(client: Client, user_id: str, payload: dict) -> dict:
    persona = _own_persona(client, user_id)
    _check_category(client, payload.get("id_category"))
    isi = payload["isi"].strip()
    judul = (payload.get("judul") or "").strip()
    if not isi:
        raise bad_request("Cerita tidak boleh kosong")
    if not judul:
        # Kolom judul wajib di database; pakai potongan awal cerita bila tidak diisi.
        first_line = isi.splitlines()[0]
        judul = first_line if len(first_line) <= 120 else first_line[:117].rstrip() + "…"
    body = {
        "id_user": user_id,
        "id_persona": persona["id_persona"],
        "id_category": payload.get("id_category"),
        "judul": judul,
        "isi": isi,
    }
    created = run(client.table("posts").insert(body).select("id_post")).data[0]
    return get_post(client, user_id, created["id_post"])


def _assert_owner(client: Client, table: str, key: str, row_id: str, user_id: str) -> dict:
    result = run(client.table(table).select("id_user, status").eq(key, row_id).maybe_single())
    if not result.data or result.data["status"] == "DELETED":
        raise not_found("Konten tidak ditemukan")
    if result.data["id_user"] != user_id:
        raise forbidden("Kamu hanya dapat mengubah tulisanmu sendiri")
    if result.data["status"] == "HIDDEN":
        raise forbidden("Konten ini sedang disembunyikan moderator dan tidak dapat diubah")
    return result.data


def update_post(client: Client, user_id: str, post_id: str, payload: dict) -> dict:
    _assert_owner(client, "posts", "id_post", post_id, user_id)
    if "id_category" in payload:
        _check_category(client, payload["id_category"])
    if payload:
        run(client.table("posts").update(payload).eq("id_post", post_id))
    if payload.get("status") == "DELETED":
        return {**_strip_user(_get_post_row(client, post_id), user_id)}
    return get_post(client, user_id, post_id)


# --- answers ---------------------------------------------------------------

def _enrich_answers(client: Client, user_id: str, answers: list[dict]) -> list[dict]:
    if not answers:
        return []
    ids = [a["id_answer"] for a in answers]
    hugs = run(client.table("answer_hugs").select("id_answer, id_user").in_("id_answer", ids)).data
    hug_counts = _count_by(hugs, "id_answer")
    my_hugs = {h["id_answer"] for h in hugs if h["id_user"] == user_id}
    comments = run(
        client.table("answer_comments")
        .select("id_answer")
        .in_("id_answer", ids)
        .eq("status", "PUBLISHED")
    ).data
    comment_counts = _count_by(comments, "id_answer")
    psych = _verified_psychologists(client, {a["id_user"] for a in answers})

    for a in answers:
        _strip_user(a, user_id, psych)
        a["jumlah_peluk"] = hug_counts.get(a["id_answer"], 0)
        a["sudah_dipeluk"] = a["id_answer"] in my_hugs
        a["jumlah_komentar"] = comment_counts.get(a["id_answer"], 0)
    return answers


def list_answers(client: Client, user_id: str, post_id: str, limit: int, offset: int) -> list[dict]:
    _require_published_post(client, post_id)
    rows = run(
        client.table("answers")
        .select(_ANSWER_SELECT)
        .eq("id_post", post_id)
        .eq("status", "PUBLISHED")
        .order("created_at")
        .range(offset, offset + limit - 1)
    ).data
    return _enrich_answers(client, user_id, rows)


def _get_answer_row(client: Client, answer_id: str) -> dict:
    result = run(
        client.table("answers").select(_ANSWER_SELECT).eq("id_answer", answer_id).maybe_single()
    )
    if not result.data:
        raise not_found("Balasan tidak ditemukan")
    return result.data


def create_answer(client: Client, user_id: str, post_id: str, payload: dict) -> dict:
    persona = _own_persona(client, user_id)
    _require_published_post(client, post_id)
    body = {
        "id_post": post_id,
        "id_user": user_id,
        "id_persona": persona["id_persona"],
        "isi": payload["isi"].strip(),
    }
    created = run(client.table("answers").insert(body).select("id_answer")).data[0]
    return _enrich_answers(client, user_id, [_get_answer_row(client, created["id_answer"])])[0]


def update_answer(client: Client, user_id: str, answer_id: str, payload: dict) -> dict:
    _assert_owner(client, "answers", "id_answer", answer_id, user_id)
    if payload:
        run(client.table("answers").update(payload).eq("id_answer", answer_id))
    return _enrich_answers(client, user_id, [_get_answer_row(client, answer_id)])[0]


# --- answer comments ---------------------------------------------------------------

def _require_published_answer(client: Client, answer_id: str) -> dict:
    answer = _get_answer_row(client, answer_id)
    if answer["status"] != "PUBLISHED":
        raise not_found("Balasan tidak ditemukan")
    _require_published_post(client, answer["id_post"])
    return answer


def _enrich_comments(client: Client, user_id: str, comments: list[dict]) -> list[dict]:
    psych = _verified_psychologists(client, {c["id_user"] for c in comments})
    return [_strip_user(c, user_id, psych) for c in comments]


def list_comments(client: Client, user_id: str, answer_id: str, limit: int, offset: int) -> list[dict]:
    _require_published_answer(client, answer_id)
    rows = run(
        client.table("answer_comments")
        .select(_COMMENT_SELECT)
        .eq("id_answer", answer_id)
        .eq("status", "PUBLISHED")
        .order("created_at")
        .range(offset, offset + limit - 1)
    ).data
    return _enrich_comments(client, user_id, rows)


def _get_comment_row(client: Client, comment_id: str) -> dict:
    result = run(
        client.table("answer_comments").select(_COMMENT_SELECT).eq("id_comment", comment_id).maybe_single()
    )
    if not result.data:
        raise not_found("Komentar tidak ditemukan")
    return result.data


def create_comment(client: Client, user_id: str, answer_id: str, payload: dict) -> dict:
    persona = _own_persona(client, user_id)
    _require_published_answer(client, answer_id)
    body = {
        "id_answer": answer_id,
        "id_user": user_id,
        "id_persona": persona["id_persona"],
        "isi": payload["isi"].strip(),
    }
    created = run(client.table("answer_comments").insert(body).select("id_comment")).data[0]
    return _enrich_comments(client, user_id, [_get_comment_row(client, created["id_comment"])])[0]


def update_comment(client: Client, user_id: str, comment_id: str, payload: dict) -> dict:
    _assert_owner(client, "answer_comments", "id_comment", comment_id, user_id)
    if payload:
        run(client.table("answer_comments").update(payload).eq("id_comment", comment_id))
    return _enrich_comments(client, user_id, [_get_comment_row(client, comment_id)])[0]


# --- hugs ---------------------------------------------------------------

def _toggle_hug(client: Client, table: str, key: str, target_id: str, user_id: str) -> dict:
    existing = run(
        client.table(table).select(key).eq(key, target_id).eq("id_user", user_id).maybe_single()
    )
    if existing.data:
        run(client.table(table).delete().eq(key, target_id).eq("id_user", user_id))
    else:
        run(client.table(table).insert({key: target_id, "id_user": user_id}))
    total = run(client.table(table).select(key, count="exact").eq(key, target_id).limit(1)).count
    return {"dipeluk": not existing.data, "jumlah_peluk": total or 0}


def toggle_post_hug(client: Client, user_id: str, post_id: str) -> dict:
    _require_published_post(client, post_id)
    return _toggle_hug(client, "post_hugs", "id_post", post_id, user_id)


def toggle_answer_hug(client: Client, user_id: str, answer_id: str) -> dict:
    _require_published_answer(client, answer_id)
    return _toggle_hug(client, "answer_hugs", "id_answer", answer_id, user_id)
