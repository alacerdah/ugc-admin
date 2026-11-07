import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { CarouselPost } from "../lib/types";
import { Alert, Button, GlassCard, TextField } from "./ui";

function AddPostForm({ onAdd }: { onAdd: (fields: { instagram_url: string; canva_url: string; title: string }) => Promise<void> }) {
  const [instagramUrl, setInstagramUrl] = useState("");
  const [canvaUrl, setCanvaUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!instagramUrl.trim()) return;
    setLoading(true);
    try {
      await onAdd({ instagram_url: instagramUrl.trim(), canva_url: canvaUrl.trim(), title: title.trim() });
      setInstagramUrl("");
      setCanvaUrl("");
      setTitle("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="Link do Instagram"
        type="url"
        placeholder="https://www.instagram.com/p/..."
        value={instagramUrl}
        onChange={(e) => setInstagramUrl(e.target.value)}
        required
      />
      <TextField
        label="Embed do Canva (opcional)"
        hint="Sem isso, o post do Instagram já aparece com swipe entre as fotos. Com isso, mostra o embed do Canva como capa + um link pra ver no Instagram."
        type="url"
        placeholder="https://www.canva.com/design/.../view?embed"
        value={canvaUrl}
        onChange={(e) => setCanvaUrl(e.target.value)}
      />
      <TextField label="Título (opcional)" placeholder="Ex: Antes e depois" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex justify-end">
        <Button type="submit" loading={loading} icon={<Plus className="size-4" aria-hidden />}>
          Adicionar carrossel
        </Button>
      </div>
    </form>
  );
}

function PostRow({
  post,
  index,
  total,
  dragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onMove,
  onEdit,
  onDelete,
}: {
  post: CarouselPost;
  index: number;
  total: number;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onMove: (delta: number) => void;
  onEdit: (patch: Partial<Pick<CarouselPost, "instagram_url" | "canva_url" | "title">>) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`glass flex flex-col gap-2 rounded-2xl p-3 transition ${dragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <GripVertical className="mt-1 hidden size-5 shrink-0 cursor-grab text-ink-faint sm:block" aria-hidden />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 rounded-lg bg-blue-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-dark">Instagram</span>
            <input
              key={`ig-${post.id}`}
              defaultValue={post.instagram_url}
              placeholder="https://www.instagram.com/p/..."
              onBlur={(e) => e.target.value.trim() !== post.instagram_url && onEdit({ instagram_url: e.target.value.trim() })}
              className="min-w-0 flex-1 truncate rounded-lg bg-transparent px-1 py-0.5 text-sm text-ink outline-none hover:bg-white/60 focus:bg-white"
            />
            <a href={post.instagram_url} target="_blank" rel="noopener noreferrer" className="rounded-full p-1.5 text-ink-soft hover:bg-white hover:text-ink" aria-label="Abrir no Instagram">
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 rounded-lg bg-purple-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-dark">Canva</span>
            <input
              key={`canva-${post.id}`}
              defaultValue={post.canva_url ?? ""}
              placeholder="opcional — embed/iframe do Canva"
              onBlur={(e) => e.target.value.trim() !== (post.canva_url ?? "") && onEdit({ canva_url: e.target.value.trim() })}
              className="min-w-0 flex-1 truncate rounded-lg bg-transparent px-1 py-0.5 text-sm text-ink outline-none hover:bg-white/60 focus:bg-white"
            />
          </div>
          <input
            key={`title-${post.id}`}
            defaultValue={post.title}
            placeholder="Título (opcional)"
            maxLength={80}
            onBlur={(e) => e.target.value.trim() !== post.title && onEdit({ title: e.target.value.trim() })}
            className="min-w-0 w-full bg-transparent px-1 py-0.5 text-xs text-ink-soft outline-none placeholder:text-ink-faint hover:bg-white/60 focus:bg-white"
          />
        </div>

        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink disabled:opacity-30" aria-label="Mover para cima">
            <ChevronUp className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink disabled:opacity-30" aria-label="Mover para baixo">
            <ChevronDown className="size-4" aria-hidden />
          </button>
          {confirmDelete ? (
            <div className="flex flex-col items-center gap-1">
              <Button variant="danger" className="px-2.5 py-1 text-xs" onClick={onDelete}>
                Sim
              </Button>
              <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setConfirmDelete(false)}>
                Não
              </Button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full p-2 text-ink-soft hover:bg-danger-soft hover:text-danger" aria-label="Remover carrossel">
              <Trash2 className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function CarouselManager({ projectId }: { projectId: string }) {
  const [posts, setPosts] = useState<CarouselPost[] | null>(null);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    setPosts(null);
    setError("");
    api<CarouselPost[]>(`/carousel-posts?project_id=${projectId}`)
      .then(setPosts)
      .catch((e) => setError(errorMessage(e)));
  }, [projectId]);

  const saveOrder = async (next: CarouselPost[]) => {
    const before = posts;
    setPosts(next);
    try {
      await api("/carousel-posts", { method: "PUT", body: { project_id: projectId, ids: next.map((p) => p.id) } });
    } catch (err) {
      setPosts(before);
      setError(errorMessage(err));
    }
  };

  const move = (index: number, delta: number) => {
    if (!posts) return;
    const target = index + delta;
    if (target < 0 || target >= posts.length) return;
    const next = [...posts];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  };

  const onDrop = (e: DragEvent, overId: string) => {
    e.preventDefault();
    if (!posts || !dragId || dragId === overId) return setDragId(null);
    const next = [...posts];
    const from = next.findIndex((p) => p.id === dragId);
    const to = next.findIndex((p) => p.id === overId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setDragId(null);
    saveOrder(next);
  };

  const addPost = async (fields: { instagram_url: string; canva_url: string; title: string }) => {
    const created = await api<CarouselPost>("/carousel-posts", { method: "POST", body: { project_id: projectId, ...fields } });
    setPosts((list) => [...(list ?? []), created]);
  };

  const editPost = async (post: CarouselPost, patch: Partial<Pick<CarouselPost, "instagram_url" | "canva_url" | "title">>) => {
    const before = posts;
    setPosts((list) => list?.map((p) => (p.id === post.id ? { ...p, ...patch } : p)) ?? null);
    try {
      await api("/carousel-posts", {
        method: "PATCH",
        body: { id: post.id, instagram_url: post.instagram_url, canva_url: post.canva_url ?? "", title: post.title, ...patch },
      });
    } catch (err) {
      setPosts(before);
      setError(errorMessage(err));
    }
  };

  const deletePost = async (post: CarouselPost) => {
    const before = posts;
    setPosts((list) => list?.filter((p) => p.id !== post.id) ?? null);
    try {
      await api(`/carousel-posts?id=${post.id}`, { method: "DELETE" });
    } catch (err) {
      setPosts(before);
      setError(errorMessage(err));
    }
  };

  if (posts === null && !error) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <div className="glass h-64 animate-pulse rounded-3xl" />
      </div>
    );
  }

  return (
    <GlassCard className="flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Carrossel</h2>
        <p className="text-sm text-ink-soft">
          Só o link do Instagram já embeda o carrossel inteiro, com swipe entre as fotos. Se quiser controlar a capa mostrada, adicione também um embed do Canva —
          nesse caso o site mostra o Canva e um link separado pra ver no Instagram.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <AddPostForm onAdd={addPost} />

      {posts?.length === 0 && <p className="text-sm text-ink-soft">Nenhum carrossel ainda. Cole um link do Instagram acima.</p>}

      {posts && posts.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {posts.map((post, index) => (
            <PostRow
              key={post.id}
              post={post}
              index={index}
              total={posts.length}
              dragging={dragId === post.id}
              onDragStart={() => setDragId(post.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, post.id)}
              onMove={(delta) => move(index, delta)}
              onEdit={(patch) => editPost(post, patch)}
              onDelete={() => deletePost(post)}
            />
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
