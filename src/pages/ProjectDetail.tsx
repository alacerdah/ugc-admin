import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAccount } from "../auth/AuthProvider";
import { api, errorMessage } from "../lib/api";
import type { Project } from "../lib/types";
import { Alert, PageHeader } from "../components/ui";
import ProjectConfigForm from "../components/ProjectConfigForm";
import NichesManager from "../components/NichesManager";

const TABS = [
  { id: "content", label: "Nichos e links" },
  { id: "config", label: "Configurações" },
] as const;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAccount();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("content");

  useEffect(() => {
    if (!id) return;
    api<Project>(`/projects?id=${id}`)
      .then(setProject)
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!project) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <div className="glass h-10 w-48 animate-pulse rounded-full" />
        <div className="glass h-64 animate-pulse rounded-3xl" />
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const tabs = isAdmin ? TABS : TABS.filter((t) => t.id === "content");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/app" className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Projetos
        </Link>
        <PageHeader title={project.name} description={`/${project.slug}`} />
      </div>

      <div className="glass inline-flex w-fit rounded-full p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.id ? "bg-gradient-to-r from-blue to-purple text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "content" ? (
        <NichesManager projectId={project.id} />
      ) : (
        <ProjectConfigForm project={project} onSaved={setProject} readOnly={user.role !== "admin"} />
      )}
    </div>
  );
}
