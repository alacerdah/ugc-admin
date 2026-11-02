import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { api, errorMessage } from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import { Alert, Button, TextField } from "../components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Esqueci minha senha" subtitle="Mandamos um link de redefinição pro seu email.">
      {sent ? (
        <Alert tone="success">
          Se esse email tiver uma conta, você vai receber um link pra redefinir a senha em instantes.
        </Alert>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} className="mt-2 w-full py-3">
            Enviar link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link to="/login" className="font-semibold text-blue hover:text-purple">
          Voltar para o login
        </Link>
      </p>
    </AuthLayout>
  );
}
