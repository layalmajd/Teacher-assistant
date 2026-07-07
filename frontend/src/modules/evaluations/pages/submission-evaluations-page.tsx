import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { cn } from "@/lib/cn";
import { getUserFacingErrorMessage } from "@/lib/error-messages";
import { EvaluationQuickSummary } from "@/modules/evaluations/components/evaluation-quick-summary";
import { fetchSubmissionEvaluations, reEvaluateSubmission } from "@/services/evaluations";

const DEFAULT_PAGE_SIZE = 10;
const SUBMISSION_EVALUATIONS_RETURN_STATE_KEY = "submissionEvaluationsReturnState";

type SubmissionEvaluationsRouteState = {
  page?: number;
  pageSize?: number;
  expandedId?: string | null;
  focusEvaluationId?: string;
};

function readStoredReturnState() {
  const rawState = sessionStorage.getItem(SUBMISSION_EVALUATIONS_RETURN_STATE_KEY);
  if (!rawState) {
    return null;
  }

  sessionStorage.removeItem(SUBMISSION_EVALUATIONS_RETURN_STATE_KEY);
  try {
    return JSON.parse(rawState) as SubmissionEvaluationsRouteState;
  } catch {
    return null;
  }
}

export function SubmissionEvaluationsPage() {
  const { t } = useTranslation();
  const { submissionId = "" } = useParams();
  const location = useLocation();
  const routeState = (location.state as SubmissionEvaluationsRouteState | null) ?? readStoredReturnState();
  const queryClient = useQueryClient();
  const didMountRef = useRef(false);
  const [page, setPage] = useState(() => routeState?.page ?? 1);
  const [pageSize, setPageSize] = useState(() => routeState?.pageSize ?? DEFAULT_PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(() => routeState?.expandedId ?? null);
  const [focusEvaluationId, setFocusEvaluationId] = useState<string | null>(
    () => routeState?.focusEvaluationId ?? null,
  );
  const evaluationsQuery = useQuery({
    queryKey: ["submission-evaluations", submissionId],
    queryFn: () => fetchSubmissionEvaluations(submissionId),
    enabled: Boolean(submissionId),
  });
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setPage(1);
    setExpandedId(null);
    setFocusEvaluationId(null);
  }, [submissionId]);

  const evaluations = evaluationsQuery.data ?? [];

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(evaluations.length / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
      setExpandedId(null);
    }
  }, [evaluations.length, page, pageSize]);

  const visibleEvaluations = evaluations.slice((page - 1) * pageSize, page * pageSize);
  const buildReturnState = (evaluationId: string): SubmissionEvaluationsRouteState => ({
    page,
    pageSize,
    expandedId,
    focusEvaluationId: evaluationId,
  });

  useEffect(() => {
    if (!focusEvaluationId || !visibleEvaluations.some((evaluation) => evaluation.id === focusEvaluationId)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const element = document.getElementById(`submission-evaluation-${focusEvaluationId}`);
      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      element?.focus({ preventScroll: true });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [focusEvaluationId, visibleEvaluations]);

  const reevaluateMutation = useMutation({
    mutationFn: () => reEvaluateSubmission(submissionId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["submission-evaluations", submissionId] });
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });
      void queryClient.invalidateQueries({ queryKey: ["submission-report"] });
    },
    onSuccess: () => {
      toast.success(t("evaluations.reEvaluate"));
    },
    onError: (error: Error) => toast.error(getUserFacingErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("evaluations.title")} subtitle={t("evaluations.subtitle")} />
      <div className="flex justify-end">
        <Button type="button" onClick={() => reevaluateMutation.mutate()} disabled={reevaluateMutation.isPending}>
          {reevaluateMutation.isPending ? t("common.loading") : t("evaluations.reEvaluate")}
        </Button>
      </div>
      {evaluations.length ? (
        <div className="space-y-4">
          {visibleEvaluations.map((evaluation) => (
            <Card
              key={evaluation.id}
              id={`submission-evaluation-${evaluation.id}`}
              tabIndex={-1}
              className={cn(
                "p-5 outline-none transition duration-300",
                focusEvaluationId === evaluation.id &&
                  "border-primary bg-primary/15 shadow-[0_0_0_4px_hsl(var(--primary)/0.18),0_18px_42px_hsl(var(--primary)/0.16)] ring-4 ring-primary/35",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge>#{evaluation.evaluation_number}</Badge>
                    {evaluation.is_latest ? <Badge>{t("evaluations.latest")}</Badge> : null}
                  </div>
                  <p className="break-words text-sm text-foreground/70" dir="auto">
                    {evaluation.submission_filename}
                  </p>
                  <p className="break-words text-sm">
                    {t("evaluations.finalAdjusted")}: {evaluation.final_adjusted_score ?? "-"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setExpandedId((current) => (current === evaluation.id ? null : evaluation.id))}
                  >
                    {expandedId === evaluation.id
                      ? t("evaluations.hideQuickSummary")
                      : t("evaluations.quickSummary")}
                  </Button>
                  <Link
                    to={`/evaluations/${evaluation.id}`}
                    onClick={() => {
                      sessionStorage.setItem(
                        SUBMISSION_EVALUATIONS_RETURN_STATE_KEY,
                        JSON.stringify(buildReturnState(evaluation.id)),
                      );
                    }}
                    state={{
                      returnTo: {
                        pathname: `/submissions/${submissionId}/evaluations`,
                        state: buildReturnState(evaluation.id),
                      },
                    }}
                  >
                    <Button variant="ghost" type="button">{t("evaluations.viewEvaluation")}</Button>
                  </Link>
                  <Link
                    to={`/evaluations/${evaluation.id}#manual-adjustments`}
                    onClick={() => {
                      sessionStorage.setItem(
                        SUBMISSION_EVALUATIONS_RETURN_STATE_KEY,
                        JSON.stringify(buildReturnState(evaluation.id)),
                      );
                    }}
                    state={{
                      returnTo: {
                        pathname: `/submissions/${submissionId}/evaluations`,
                        state: buildReturnState(evaluation.id),
                      },
                    }}
                  >
                    <Button type="button">{t("evaluations.editScore")}</Button>
                  </Link>
                </div>
              </div>
              {expandedId === evaluation.id ? (
                <div className="mt-4">
                  <EvaluationQuickSummary evaluationId={evaluation.id} />
                </div>
              ) : null}
            </Card>
          ))}
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={evaluations.length}
            isFetching={evaluationsQuery.isFetching}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              setExpandedId(null);
            }}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
              setExpandedId(null);
            }}
          />
        </div>
      ) : (
        <EmptyState title={t("evaluations.title")} description={t("empty.noData")} />
      )}
    </div>
  );
}
