import pytest

from app.core.config import parse_string_list


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
