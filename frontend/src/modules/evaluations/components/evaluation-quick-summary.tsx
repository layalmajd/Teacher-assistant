import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/shared/badge";
import { cn } from "@/lib/cn";
import { fetchEvaluationDetail } from "@/services/evaluations";
import type { CriterionScore } from "@/types/api";

type QuickStatus = "excellent" | "good" | "review";
type ScoreSnapshot = {
  points: number | null;
  percent: number | null;
  status: QuickStatus;
};

function scoreSnapshot(score: CriterionScore, gradeScale: number): ScoreSnapshot {
  const rawScore = score.manual_score ?? score.ai_score;
  if (rawScore == null || gradeScale <= 0) {
    return {
      points: null,
      percent: null,
      status: "review",
    };
  }

  const percent = (rawScore / gradeScale) * 100;
  const points = (score.weight * percent) / 100;
  const status: QuickStatus = percent >= 90 ? "excellent" : percent >= 70 ? "good" : "review";

  return {
    points,
    percent,
    status,
  };
}

function statusLabelKey(status: QuickStatus) {
  if (status === "excellent") {
    return "evaluations.quickStatusExcellent";
  }
  if (status === "good") {
    return "evaluations.quickStatusGood";
  }
  return "evaluations.quickStatusReview";
}

function statusClassName(status: QuickStatus) {
  if (status === "excellent") {
    return "border-success/30 bg-success/10 text-success";
  }
  if (status === "good") {
    return "border-warning/35 bg-warning/10 text-warning";
  }
  return "border-danger/30 bg-danger/10 text-danger";
}

export function EvaluationQuickSummary({ evaluationId }: { evaluationId: string }) {
  const { t } = useTranslation();
  const detailQuery = useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: () => fetchEvaluationDetail(evaluationId),
    enabled: Boolean(evaluationId),
  });

  if (detailQuery.isPending) {
    return <p className="text-sm text-foreground/60">{t("common.loading")}</p>;
  }

  if (!detailQuery.data || detailQuery.isError) {
    return <p className="text-sm text-foreground/60">{t("empty.noData")}</p>;
  }

  const { criterion_scores: criterionScores, grade_scale: gradeScale } = detailQuery.data;

  if (!criterionScores.length) {
    return <p className="text-sm text-foreground/60">{t("empty.noData")}</p>;
  }

  return (
    <div className="space-y-3 rounded-2xl bg-muted/50 p-4">
      <h4 className="font-semibold">{t("evaluations.quickSummary")}</h4>
      <div className="grid gap-2">
        {criterionScores.map((score) => {
          const snapshot = scoreSnapshot(score, gradeScale);
          return (
            <div
              key={score.id}
              className="grid min-w-0 gap-3 rounded-xl border border-border/60 bg-background/85 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
            >
              <p className="min-w-0 break-words text-sm font-bold text-foreground/85" dir="auto">
                {score.criterion_name}
              </p>
              <span className="min-w-0 break-words text-sm font-semibold text-foreground/70">
                {snapshot.points == null || snapshot.percent == null
                  ? t("common.notAvailable")
                  : t("submissions.criterionScoreFormat", {
                      score: snapshot.points.toFixed(2),
                      weight: score.weight,
                      percent: snapshot.percent.toFixed(1),
                    })}
              </span>
              <Badge className={cn("justify-center", statusClassName(snapshot.status))}>
                {t(statusLabelKey(snapshot.status))}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
