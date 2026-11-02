import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Project } from "../lib/types";
import { Alert, Button, GlassCard, TextField } from "./ui";

export default function ProjectConfigForm({ project, onSaved, readOnly }: { project: Project; onSaved: (p: Project) => void; readOnly: boolean }) {
  const navigate = useNavigate();
  const [name, setName] = useState(project.name);
  const [domain, setDomain] = useState(project.domain);
  const [repoName, setRepoName] = useState(project.repo_name);
  const [contactEmail, setContactEmail] = useState(project.contact_email);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const remove = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api(`/projects?id=${project.id}`, { method: "DELETE" });
      navigate("/app", { replace: true });
    } catch (err) {
      setDeleteError(errorMessage(err));
      setDeleting(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const updated = await api<Project>("/projects", {
        method: "PATCH",
        body: { id: project.id, name, domain, repo_name: repoName, contact_email: contactEmail },
      });
      onSaved(updated);
      setNotice("Configurações salvas.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-5 sm:p-6">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}

        <TextField label="Nome do projeto" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} required />

        <TextField
          label="Slug"
          value={project.slug}
          disabled
          hint="Identificador público usado pelo endpoint de vídeos. Não pode ser alterado depois de criado."
        />

        <TextField
          label="Domínio"
          placeholder="ariana.com.br"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          hint="Só referência — não é usado pelo endpoint, pode mudar livremente."
          disabled={readOnly}
        />

        <TextField
          label="Repositório"
          placeholder="template-ariana"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          hint="Anotação pra saber onde fica o código deste projeto."
          disabled={readOnly}
        />

        <TextField
          label="Email de contato"
          type="email"
          placeholder="contato@ariana.com.br"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          hint="Pra onde vão os leads do formulário de contato deste site."
          disabled={readOnly}
        />

        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              Salvar
            </Button>
          </div>
        )}
      </form>

      {!readOnly && (
        <div className="mt-8 flex flex-col gap-3 border-t border-ink/10 pt-6">
          <div>
            <h3 className="font-bold text-danger">Zona de risco</h3>
            <p className="text-sm text-ink-soft">Exclui o projeto e todos os nichos e links dele. Não tem como desfazer.</p>
          </div>
          {deleteError && <Alert tone="error">{deleteError}</Alert>}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button variant="danger" loading={deleting} onClick={remove}>
                Confirmar exclusão de "{project.name}"?
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="danger"
              className="self-start"
              icon={<Trash2 className="size-4" aria-hidden />}
              onClick={() => setConfirmDelete(true)}
            >
              Excluir projeto
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  );
}
