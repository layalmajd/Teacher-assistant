from app.utils.student_id_extractor import extract_student_id


def test_extracts_plain_id_label_from_pdf_header_text() -> None:
    text = """
    ASE Assignment 1

    Name : LAYAL ADEL Al-MAJDALAWI
     ID : 220222667

    Q1. Briefly explain the concept of Microservices.
    """

    assert extract_student_id(text) == "220222667"


def test_plain_id_label_must_start_a_line_to_avoid_body_matches() -> None:
    text = """
    This answer mentions a record id: 987654321 inside a paragraph.
    The actual submission does not include a student identifier.
    """

    assert extract_student_id(text) is None
