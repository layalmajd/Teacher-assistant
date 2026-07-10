from app.utils.student_id_extractor import extract_student_id


def test_extracts_plain_id_label_from_pdf_header_text() -> None:
    text = """
    ASE Assignment 1

    Name : LAYAL ADEL Al-MAJDALAWI
     ID : 220222667

    Q1. Briefly explain the concept of Microservices.
    """

    assert extract_student_id(text) == "220222667"


def test_extracts_arabic_university_id_label() -> None:
    text = """
    الرقم الجامعي : 220218903

    بحث حول التغير المناخي
    """

    assert extract_student_id(text) == "220218903"


def test_extracts_arabic_university_id_when_pdf_text_is_reversed() -> None:
    text = """
    220218903 : يعماجلا مقرلا

    بحث حول التغير المناخي
    """

    assert extract_student_id(text) == "220218903"


def test_extracts_arabic_university_id_when_label_letters_are_spaced() -> None:
    text = """
    ا ل ر ق م   ا ل ج ا م ع ي : ۲۲۰۲۱۸۹۰۳

    بحث حول التغير المناخي
    """

    assert extract_student_id(text) == "220218903"


def test_extracts_unique_top_page_student_number_without_label() -> None:
    text = """
    220218903

    بحث حول التغير المناخي
    """

    assert extract_student_id(text) == "220218903"


def test_does_not_extract_unlabeled_id_when_top_page_has_multiple_numbers() -> None:
    text = """
    220218903
    20260710

    بحث حول التغير المناخي
    """

    assert extract_student_id(text) is None


def test_plain_id_label_must_start_a_line_to_avoid_body_matches() -> None:
    text = """
    This answer mentions a record id: 987654321 inside a paragraph.
    The actual submission does not include a student identifier.
    """

    assert extract_student_id(text) is None
