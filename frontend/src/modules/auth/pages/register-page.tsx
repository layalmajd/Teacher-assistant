import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { useAuthStore } from "@/app/store/use-auth-store";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { getUserFacingErrorMessage } from "@/lib/error-messages";
import { AuthFormShell } from "@/modules/auth/components/auth-form-shell";
import { register } from "@/services/auth";

const schema = z.object({
  username: z.string().min(1, "auth.usernameRequired").min(3, "auth.usernameMin"),
  email: z.string().min(1, "auth.emailRequired").email("auth.emailInvalid"),
  password: z.string().min(1, "auth.passwordRequired").min(8, "auth.passwordMin"),
});

type FormValues = z.infer<typeof schema>;

function getFirstValidationMessage(errors: FieldErrors<FormValues>) {
  return errors.username?.message || errors.email?.message || errors.password?.message;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      setSession({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        instructor: response.instructor,
      });
      toast.success(t("auth.register"));
      navigate("/");
    },
    onError: (error: Error) => toast.error(getUserFacingErrorMessage(error)),
  });

  return (
    <AuthFormShell title={t("auth.registerTitle")} subtitle={t("auth.registerSubtitle")}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(
          (values) => mutation.mutate(values),
          (errors) => {
            const message = getFirstValidationMessage(errors);
            toast.error(message ? t(message) : t("errors.validation.invalidRequest"));
          },
        )}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("auth.username")}</label>
          <Input {...form.register("username")} autoComplete="username" />
          {form.formState.errors.username?.message ? (
            <p className="text-sm font-semibold text-danger">{t(form.formState.errors.username.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("auth.email")}</label>
          <Input {...form.register("email")} type="email" autoComplete="email" />
          {form.formState.errors.email?.message ? (
            <p className="text-sm font-semibold text-danger">{t(form.formState.errors.email.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("auth.password")}</label>
          <Input {...form.register("password")} type="password" autoComplete="new-password" />
          {form.formState.errors.password?.message ? (
            <p className="text-sm font-semibold text-danger">{t(form.formState.errors.password.message)}</p>
          ) : null}
        </div>
        <Button className="mt-2 w-full" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t("common.loading") : t("auth.register")}
        </Button>
        <p className="text-center text-sm text-foreground/65">
          {t("auth.haveAccount")}{" "}
          <Link className="font-bold text-primary transition hover:text-primary/80" to="/login">
            {t("auth.login")}
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}
