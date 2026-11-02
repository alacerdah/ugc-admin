import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { errorMessage } from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import { Alert, Button, TextField } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // com a conta carregada, o GuestOnly leva pra página de origem
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse o painel dos seus projetos.">
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
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link to="/esqueci-senha" className="text-sm font-semibold text-blue hover:text-purple">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" loading={loading} className="mt-2 w-full py-3">
          Entrar
        </Button>
        <p className="text-center text-sm text-ink-soft">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-blue hover:text-purple">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
