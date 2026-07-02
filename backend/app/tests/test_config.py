import pytest

from app.core.config import async_database_url_and_connect_args, parse_string_list, sync_database_url


def test_parse_string_list_accepts_json_array() -> None:
    assert parse_string_list('["http://localhost:5173","https://example.com"]') == [
        "http://localhost:5173",
        "https://example.com",
    ]


def test_parse_string_list_accepts_comma_separated_values() -> None:
    assert parse_string_list("pdf, .docx, txt") == ["pdf", ".docx", "txt"]


def test_parse_string_list_rejects_non_array_json() -> None:
    with pytest.raises(ValueError, match="Expected a JSON array"):
        parse_string_list('{"origin":"https://example.com"}')


def test_sync_database_url_converts_asyncpg_ssl_for_psycopg() -> None:
    assert sync_database_url(
        "postgresql+asyncpg://user:pass@example.com/db?ssl=require"
    ) == "postgresql+psycopg://user:pass@example.com/db?sslmode=require"


def test_async_database_url_converts_ssl_query_to_connect_args() -> None:
    url, connect_args = async_database_url_and_connect_args(
        "postgresql+asyncpg://user:pass@example.com/db?ssl=require"
    )

    assert url == "postgresql+asyncpg://user:pass@example.com/db"
    assert connect_args == {"ssl": True}
