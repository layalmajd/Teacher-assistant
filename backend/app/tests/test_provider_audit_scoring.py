from app.adapters.ai.base import CriterionDefinition, EvaluationInput
from app.adapters.ai.groq_provider import GroqProvider
from app.adapters.ai.ollama_provider import OllamaProvider
from app.models.enums import ProviderName


def _audit_items() -> list[dict]:
    return [
        {
            "requirement": f"Requirement {index + 1}",
            "status": "met" if index < 4 else "missing",
            "evidence": f"Evidence {index + 1}" if index < 4 else "Not found",
            "missing_or_weak_reason": "" if index < 4 else "missing",
        }
        for index in range(10)
    ]


def _payload(*, provider: ProviderName, auto_adjustment: bool) -> EvaluationInput:
    return EvaluationInput(
        provider_name=provider,
        model_name="test-model",
        api_key="test-key",
        prompt="test prompt",
        submission_text="test submission",
        criteria=[
            CriterionDefinition(
                id="criterion-1",
                name="General checklist",
                weight=20,
                description="Ten equally weighted requirements.",
            )
        ],
        grade_scale=20,
        response_language="en",
        enable_auto_score_adjustment=auto_adjustment,
    )


def test_groq_respects_disabled_auto_score_adjustment() -> None:
    provider = object.__new__(GroqProvider)
    parsed = {
        "summary_feedback": "Summary.",
        "criterion_scores": [
            {
                "criterion_id": "cr_01",
                "criterion_name": "General checklist",
                "earned_points": 10.4,
                "feedback": "Four requirements are present.",
                "requirements_audit": _audit_items(),
            }
        ],
    }

    result = provider._validate_and_normalize_payload(
        parsed,
        _payload(provider=ProviderName.GROQ, auto_adjustment=False),
    )

    criterion = result["criterion_scores"][0]
    assert criterion["earned_points"] == 10.4
    assert "Auto-corrected" not in criterion["feedback"]
    assert "Requirement 10" in criterion["feedback"]


def test_groq_calculates_enabled_auto_score_from_audit() -> None:
    provider = object.__new__(GroqProvider)
    parsed = {
        "summary_feedback": "Summary.",
        "criterion_scores": [
            {
                "criterion_id": "cr_01",
                "criterion_name": "General checklist",
                "earned_points": 10.4,
                "feedback": "Four requirements are present.",
                "requirements_audit": _audit_items(),
            }
        ],
    }

    result = provider._validate_and_normalize_payload(
        parsed,
        _payload(provider=ProviderName.GROQ, auto_adjustment=True),
    )

    criterion = result["criterion_scores"][0]
    assert criterion["earned_points"] == 8
    assert criterion["deducted_points"] == 12
    assert "Auto-corrected" in criterion["feedback"]


def test_ollama_uses_the_same_enabled_audit_calculation() -> None:
    provider = object.__new__(OllamaProvider)
    parsed = {
        "summary_feedback": "Summary.",
        "criterion_scores": [
            {
                "criterion_name": "General checklist",
                "earned_points": 10.4,
                "feedback": "Four requirements are present.",
                "requirements_audit": _audit_items(),
            }
        ],
    }

    result = provider._validate_and_normalize_payload(
        parsed,
        _payload(provider=ProviderName.OLLAMA, auto_adjustment=True),
    )

    criterion = result["criterion_scores"][0]
    assert criterion["earned_points"] == 8
    assert criterion["ai_score"] == 8
    assert "Requirement 10" in criterion["feedback"]


def test_ollama_respects_disabled_auto_score_adjustment() -> None:
    provider = object.__new__(OllamaProvider)
    parsed = {
        "summary_feedback": "Summary.",
        "criterion_scores": [
            {
                "criterion_name": "General checklist",
                "earned_points": 10.4,
                "feedback": "Provider score.",
                "requirements_audit": _audit_items(),
            }
        ],
    }

    result = provider._validate_and_normalize_payload(
        parsed,
        _payload(provider=ProviderName.OLLAMA, auto_adjustment=False),
    )

    criterion = result["criterion_scores"][0]
    assert criterion["earned_points"] == 10.4
    assert criterion["ai_score"] == 10.4
    assert "Auto-corrected" not in criterion["feedback"]
