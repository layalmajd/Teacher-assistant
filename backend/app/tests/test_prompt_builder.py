from types import SimpleNamespace

from app.adapters.ai.base import CriterionDefinition, EvaluationInput
from app.adapters.ai.groq_provider import GroqProvider
from app.models.enums import ProviderName
from app.utils.prompt_builder import build_evaluation_prompt
from app.utils.prompt_policy import build_grading_rules


def test_grading_rules_require_numeric_count_gaps() -> None:
    rules = build_grading_rules(language_label="English", grade_scale=100)

    assert "found X, required Y" in rules
    assert "Do not merge" in rules
    assert "full points are forbidden" in rules


def test_evaluation_prompt_requires_separate_count_based_audit_items() -> None:
    group = SimpleNamespace(
        name="Warehouse rubric",
        description="Requires 6 functional requirements and 3 non-functional requirements.",
        grade_scale=100,
    )
    criteria = [
        SimpleNamespace(
            name="Analysis",
            weight=25,
            description="Explain the problem, target users, scope, 6 functional requirements, and 3 non-functional requirements.",
            is_manual=False,
        )
    ]

    prompt = build_evaluation_prompt(
        group=group,
        criteria=criteria,
        submission_text="Short sample submission text.",
        response_language="en",
    )

    assert "For count-based requirements, DO NOT collapse the whole count into one vague item." in prompt
    assert "If ANY audit item for a criterion is partial or missing, that criterion MUST NOT receive full points." in prompt
    assert "found 4, required 6 functional requirements" in prompt


def test_groq_prompt_defines_stable_audit_statuses() -> None:
    prompt = GroqProvider()._build_groq_prompt(
        EvaluationInput(
            provider_name=ProviderName.GROQ,
            model_name="llama-3.3-70b-versatile",
            api_key="test",
            prompt="Assignment: Grade the answer.",
            submission_text="The answer includes two tables.",
            criteria=[
                CriterionDefinition(
                    id="criterion-1",
                    name="Tables",
                    weight=20,
                    description="Requires 4 tables.",
                    is_manual=False,
                )
            ],
            grade_scale=100,
            response_language="en",
        ),
        max_submission_chars=12_000,
    )

    assert '"met" means the submission gives clear, direct, usable evidence' in prompt
    assert '"partial" means the submission gives relevant evidence' in prompt
    assert '"missing" means no clear usable evidence is present' in prompt
    assert 'Keep the same status for the same evidence' in prompt
