import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api, errorMessage } from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import { Alert, Button, TextField } from "../components/ui";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordError = password.length < 8 ? "Use pelo menos 8 caracteres." : "";
  const confirmError = confirm !== password ? "As senhas não coincidem." : "";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (passwordError || confirmError) return;
    setLoading(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, password } });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Link inválido" subtitle="Esse link de redefinição não é válido.">
        <Alert tone="error">Peça um novo link na tela de login.</Alert>
        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link to="/esqueci-senha" className="font-semibold text-blue hover:text-purple">
            Pedir novo link
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Escolha uma nova senha pra sua conta.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <TextField
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Pelo menos 8 caracteres."
          error={submitted ? passwordError || undefined : undefined}
          required
        />
        <TextField
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={submitted ? confirmError || undefined : undefined}
          required
        />
        <Button type="submit" loading={loading} className="mt-2 w-full py-3">
          Redefinir senha
        </Button>
      </form>
    </AuthLayout>
  );
}
