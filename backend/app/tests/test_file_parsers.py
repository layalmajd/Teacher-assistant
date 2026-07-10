import pytest

from app.utils.file_parsers import FileParserService


def test_pdf_parser_skips_pymupdf_when_pypdf_finds_student_id(monkeypatch: pytest.MonkeyPatch) -> None:
    parser = FileParserService()

    monkeypatch.setattr(
        parser,
        "_parse_pdf_bytes_with_pypdf",
        lambda _: "الرقم الجامعي : 220218903\nSubmission text",
    )

    def fail_if_called(_: bytes) -> str:
        raise AssertionError("PyMuPDF fallback should not run")

    monkeypatch.setattr(parser, "_parse_pdf_bytes_with_pymupdf", fail_if_called)

    assert parser._parse_pdf_bytes(b"pdf") == "الرقم الجامعي : 220218903\nSubmission text"


def test_pdf_parser_uses_pymupdf_when_pypdf_misses_student_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    parser = FileParserService()

    monkeypatch.setattr(parser, "_parse_pdf_bytes_with_pypdf", lambda _: "Submission text")
    monkeypatch.setattr(
        parser,
        "_parse_pdf_bytes_with_pymupdf",
        lambda _: "الرقم الجامعي : 220218903\nSubmission text",
    )

    assert parser._parse_pdf_bytes(b"pdf") == "الرقم الجامعي : 220218903\nSubmission text"


def test_pdf_parser_keeps_pypdf_text_when_fallback_has_no_student_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    parser = FileParserService()

    monkeypatch.setattr(parser, "_parse_pdf_bytes_with_pypdf", lambda _: "Submission text")
    monkeypatch.setattr(parser, "_parse_pdf_bytes_with_pymupdf", lambda _: "Other parsed text")

    assert parser._parse_pdf_bytes(b"pdf") == "Submission text"
