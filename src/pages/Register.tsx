import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { errorMessage } from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import { Alert, Button, TextField } from "../components/ui";

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordError = password.length < 8 ? "Use pelo menos 8 caracteres." : "";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (passwordError || name.trim().length < 2) return;
    setLoading(true);
    try {
      // com a conta criada, o GuestOnly leva pro painel
      await register({ name, email, password });
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Criar conta" subtitle="Leva menos de um minuto.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <TextField
          label="Seu nome"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={submitted && name.trim().length < 2 ? "Informe seu nome." : undefined}
          required
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Pelo menos 8 caracteres."
          error={submitted ? passwordError || undefined : undefined}
          required
        />
        <Button type="submit" loading={loading} className="mt-2 w-full py-3">
          Criar conta
        </Button>
        <p className="text-center text-sm text-ink-soft">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-blue hover:text-purple">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
