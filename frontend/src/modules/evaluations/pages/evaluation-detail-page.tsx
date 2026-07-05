import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { Input } from "@/components/shared/input";
import { getUserFacingErrorMessage } from "@/lib/error-messages";
import { applyManualAdjustments, fetchEvaluationDetail } from "@/services/evaluations";

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  },
  z.number().min(0).nullable(),
);

const schema = z.object({
  items: z.array(
    z.object({
      criterion_score_id: z.string(),
      manual_points: optionalNumber,
      feedback: z.string().nullable(),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

function ScorePanel({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number | null | undefined;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent
          ? "border-primary/25 bg-primary/10"
          : "border-border/55 bg-muted/65"
      }`}
    >
      <p className="text-sm font-semibold text-foreground/65">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-normal text-foreground">
        {value ?? "-"}
      </p>
    </div>
  );
}

function toPoints(rawScore: number | null | undefined, weight: number, gradeScale: number) {
  if (rawScore == null || gradeScale <= 0) {
    return null;
  }
  return Math.round(((rawScore / gradeScale) * weight) * 100) / 100;
}

function toRawScore(points: number | null, weight: number, gradeScale: number) {
  if (points == null || weight <= 0) {
    return null;
  }
  return Math.round(((points / weight) * gradeScale) * 100) / 100;
}

function MixedDirectionText({ text }: { text: string }) {
  const parts = text.split(/([A-Za-z][A-Za-z0-9_./()[\],:'"-]*(?:\s+[A-Za-z0-9_./()[\],:'"-]+)*)/g);

  return (
    <>
      {parts.map((part, index) =>
        /[A-Za-z]/.test(part) ? (
          <bdi key={`${part}-${index}`} dir="ltr" style={{ unicodeBidi: "isolate" }}>
            {part}
          </bdi>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function FeedbackDisplayBox({ text }: { text: string | null | undefined }) {
  const lines = (text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd());

  return (
    <div
      className="min-h-44 w-full whitespace-pre-wrap rounded-xl border border-border/75 bg-card/70 px-3 py-2 text-sm font-medium leading-7 text-foreground outline-none"
      dir="rtl"
    >
      {lines.map((line, index) => (
        <p key={`${line}-${index}`} className="text-right">
          <MixedDirectionText text={line || " "} />
        </p>
      ))}
    </div>
  );
}

export function EvaluationDetailPage() {
  const { t } = useTranslation();
  const { evaluationId = "" } = useParams();
  const queryClient = useQueryClient();
  const evaluationQuery = useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: () => fetchEvaluationDetail(evaluationId),
    enabled: Boolean(evaluationId),
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { items: [] },
  });

  useEffect(() => {
    if (evaluationQuery.data) {
      form.reset({
        items: evaluationQuery.data.criterion_scores.map((score) => ({
          criterion_score_id: score.id,
          manual_points: toPoints(score.manual_score, score.weight, evaluationQuery.data.grade_scale),
          feedback: score.feedback,
        })),
      });
    }
  }, [evaluationQuery.data, form]);

  const mutation = useMutation({
    mutationFn: (values: { items: Array<{ criterion_score_id: string; manual_score: number | null; feedback: string | null }> }) =>
      applyManualAdjustments(evaluationId, values),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ["evaluation", evaluationId] });
      void queryClient.invalidateQueries({ queryKey: ["all-evaluations"] });
      void queryClient.invalidateQueries({ queryKey: ["submission-report"] });
      void queryClient.invalidateQueries({ queryKey: ["submission-evaluations", response.submission_id] });
      toast.success(t("evaluations.applyAdjustments"));
    },
    onError: (error: Error) => toast.error(getUserFacingErrorMessage(error)),
  });

  const evaluation = evaluationQuery.data;
  const gradeScale = evaluation?.grade_scale ?? 100;
  const watchedItems = form.watch("items");
  const liveAdjustedScore = useMemo(() => {
    if (!evaluation) {
      return null;
    }
    const total = evaluation.criterion_scores.reduce((sum, score, index) => {
      const manualPoints = watchedItems[index]?.manual_points;
      const hasManualValue = typeof manualPoints === "number" && Number.isFinite(manualPoints);
      const effectiveScore = hasManualValue
        ? toRawScore(manualPoints, score.weight, gradeScale) ?? 0
        : score.manual_score ?? score.ai_score ?? 0;
      return sum + (score.weight / gradeScale) * effectiveScore;
    }, 0);
    return Math.round(total * 100) / 100;
  }, [evaluation, watchedItems]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("evaluations.title")} subtitle={t("evaluations.subtitle")} />
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {evaluation?.is_latest ? <Badge>{t("evaluations.latest")}</Badge> : null}
              {evaluation?.provider_name ? <Badge>{evaluation.provider_name}</Badge> : null}
              {evaluation?.model_name ? <Badge>{evaluation.model_name}</Badge> : null}
            </div>
            <p className="text-sm font-semibold text-foreground/55">
              {evaluation?.submission_filename ?? "-"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ScorePanel
              label={t("evaluations.finalAdjusted")}
              value={evaluation?.final_adjusted_score}
              accent
            />
            <ScorePanel
              label={t("evaluations.liveAdjustedPreview")}
              value={liveAdjustedScore}
            />
            <ScorePanel
              label={t("evaluations.totalAiScore")}
              value={evaluation?.total_ai_score}
            />
            <ScorePanel
              label={t("groups.gradeScale")}
              value={gradeScale}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-border/55 bg-background/70 p-4 sm:p-5">
            <h3 className="text-base font-bold">{t("evaluations.summaryFeedback")}</h3>
            <p className="mt-2 max-w-5xl text-sm leading-7 text-foreground/70">
              {evaluation?.ai_feedback || "-"}
            </p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6" id="manual-adjustments">
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => {
              if (!evaluation) {
                return;
              }
              const invalidItem = values.items.find((item, index) => {
                const maxWeight = evaluation.criterion_scores[index]?.weight ?? 0;
                return item.manual_points != null && item.manual_points > maxWeight;
              });
              if (invalidItem) {
                const score = evaluation.criterion_scores.find(
                  (criterionScore) => criterionScore.id === invalidItem.criterion_score_id,
                );
                toast.error(
                  t("evaluations.manualPointsRange", {
                    weight: score?.weight ?? 0,
                  }),
                );
                return;
              }
              mutation.mutate({
                items: values.items.map((item, index) => ({
                  criterion_score_id: item.criterion_score_id,
                  manual_score: toRawScore(
                    item.manual_points,
                    evaluation.criterion_scores[index]?.weight ?? 0,
                    gradeScale,
                  ),
                  feedback: item.feedback?.trim() || null,
                })),
              });
            })}
          >
            {evaluation?.criterion_scores.map((score, index) => (
              <div
                key={score.id}
                className="rounded-2xl border border-border/55 bg-muted/55 p-4 sm:p-5"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold">{score.criterion_name}</h3>
                    <p className="mt-1 text-sm text-foreground/55">
                      {t("evaluations.weightContribution", { weight: score.weight })}
                    </p>
                  </div>
                  <Badge>{score.weight}</Badge>
                </div>
                {(() => {
                  const aiPoints = toPoints(score.ai_score, score.weight, gradeScale);
                  const aiPercent = score.ai_score != null && gradeScale > 0
                    ? (score.ai_score / gradeScale) * 100
                    : null;
                  const watchedPoints = watchedItems[index]?.manual_points;
                  const hasWatchedManual = typeof watchedPoints === "number" && Number.isFinite(watchedPoints);
                  const manualPercent = hasWatchedManual && score.weight > 0
                    ? (watchedPoints / score.weight) * 100
                    : null;
                  return (
                    <div className="mb-5 grid gap-3 xl:grid-cols-3">
                      <div className="rounded-2xl border border-border/60 bg-background/85 p-4 text-sm text-foreground/70">
                        <p className="font-semibold text-foreground/55">{t("evaluations.totalAiScore")}</p>
                        <p className="mt-2 text-base font-extrabold text-foreground">
                          {t("evaluations.currentAiScore", {
                            points: aiPoints?.toFixed(2) ?? "-",
                            weight: score.weight,
                            percent: aiPercent?.toFixed(1) ?? "-",
                          })}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background/85 p-4 text-sm text-foreground/70">
                        <label className="font-semibold text-foreground/55">
                          {t("evaluations.manualScoreOutOfWeight", { weight: score.weight })}
                        </label>
                        <p className="mt-2 min-h-6 font-bold text-foreground">
                          {score.manual_score != null
                            ? t("evaluations.currentManualScore", {
                                points: toPoints(score.manual_score, score.weight, gradeScale)?.toFixed(2) ?? "-",
                                weight: score.weight,
                                percent: ((score.manual_score / gradeScale) * 100).toFixed(1),
                              })
                            : "-"}
                        </p>
                        <Input
                          {...form.register(`items.${index}.manual_points`, { valueAsNumber: true })}
                          className="mt-3"
                          type="number"
                          step="0.01"
                          placeholder={toPoints(score.ai_score, score.weight, gradeScale)?.toFixed(2) ?? ""}
                        />
                        <input
                          type="hidden"
                          {...form.register(`items.${index}.criterion_score_id`)}
                          value={score.id}
                        />
                      </div>
                      <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-foreground/70">
                        <p className="font-semibold text-foreground/55">
                          {t("evaluations.liveAdjustedPreview")}
                        </p>
                        <p className="mt-2 text-base font-extrabold text-foreground">
                          {manualPercent != null
                            ? t("evaluations.manualPercentPreview", {
                                percent: manualPercent.toFixed(1),
                              })
                            : "-"}
                        </p>
                      </div>
                    </div>
                  );
                })()}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("evaluations.criterionFeedback")}</label>
                  <FeedbackDisplayBox text={watchedItems[index]?.feedback} />
                  <input type="hidden" {...form.register(`items.${index}.feedback`)} />
                </div>
              </div>
            ))}
            <div className="sticky bottom-4 z-10 flex justify-end">
              <Button className="w-full shadow-lg sm:w-auto" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t("common.loading") : t("evaluations.applyAdjustments")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
