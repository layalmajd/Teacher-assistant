import re
import unicodedata


ARABIC_NUMERAL_TRANSLATION = str.maketrans(
    "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹",
    "01234567890123456789",
)

LABELED_PATTERNS = [
    re.compile(r"(?im)(?:رقم\s*الطالب|الرقم\s*الجامعي)\s*[:：\-#]?\s*(\d{4,20})"),
    re.compile(r"(?im)(?:student\s*id|student\s*number)\s*[:：\-#]?\s*(\d{4,20})"),
    re.compile(r"(?im)^\s*(?:id|i\.d\.|university\s*id|university\s*number)\s*[:：\-#]?\s*(\d{4,20})\b"),
    re.compile(r"(?im)(\d{4,20})\s*(?:رقم\s*الطالب|الرقم\s*الجامعي)"),
    re.compile(r"(?im)(\d{4,20})\s*(?:student\s*id|student\s*number)"),
]

COMPACT_LABELS = {
    "رقمالطالب",
    "الرقمالجامعي",
    "رقمالجامعي",
    "بلاطلامقر",
    "يعماجلامقرلا",
    "يعماجلامقر",
}

DIGIT_RUN_PATTERN = re.compile(r"(?<!\d)(?:\d[\s\u00a0\u200e\u200f\u202a-\u202e]*){4,20}(?!\d)")
ARABIC_DIACRITICS_PATTERN = re.compile(r"[\u064b-\u065f\u0670]")


def _normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    normalized = normalized.translate(ARABIC_NUMERAL_TRANSLATION)
    normalized = normalized.replace("ـ", "")
    normalized = ARABIC_DIACRITICS_PATTERN.sub("", normalized)
    return normalized


def _compact_for_label_match(text: str) -> str:
    normalized = _normalize_text(text).casefold()
    normalized = normalized.translate(str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ى": "ي"}))
    return re.sub(r"[^a-z\u0600-\u06ff]+", "", normalized)


def _digits_only(value: str) -> str:
    return re.sub(r"\D", "", value.translate(ARABIC_NUMERAL_TRANSLATION))


def _extract_labeled_digit_candidate(text: str) -> str | None:
    for match in DIGIT_RUN_PATTERN.finditer(text):
        digits = _digits_only(match.group(0))
        if not 4 <= len(digits) <= 20:
            continue
        start, end = match.span()
        window = text[max(0, start - 100) : min(len(text), end + 100)]
        compact_window = _compact_for_label_match(window)
        if any(label in compact_window for label in COMPACT_LABELS):
            return digits
    return None


def _extract_single_top_page_candidate(text: str) -> str | None:
    candidates = []
    for line in text.splitlines()[:20]:
        stripped = line.strip()
        if re.fullmatch(r"\d{6,20}", stripped):
            candidates.append(stripped)
    unique_candidates = list(dict.fromkeys(candidates))
    if len(unique_candidates) == 1:
        return unique_candidates[0]
    return None


def extract_student_id(text: str | None) -> str | None:
    if not text:
        return None

    normalized_text = _normalize_text(text)

    for pattern in LABELED_PATTERNS:
        match = pattern.search(normalized_text)
        if match:
            return match.group(1).strip()

    labeled_candidate = _extract_labeled_digit_candidate(normalized_text)
    if labeled_candidate:
        return labeled_candidate

    single_top_candidate = _extract_single_top_page_candidate(normalized_text)
    if single_top_candidate:
        return single_top_candidate

    return None


def extract_student_id_from_filename(filename: str | None) -> str | None:
    if not filename:
        return None
    normalized_name = _normalize_text(filename)
    match = re.search(r"(?<!\d)(\d{6,20})(?!\d)", normalized_name)
    if match:
        return match.group(1).strip()
    return None
