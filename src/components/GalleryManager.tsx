import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { GalleryPhoto } from "../lib/types";
import { Alert, Button, GlassCard, SelectField, TextField } from "./ui";

const GALLERY_PLATFORMS = ["instagram", "tiktok", "canva"] as const;
type GalleryPlatform = (typeof GALLERY_PLATFORMS)[number];
const PLATFORM_LABEL: Record<GalleryPlatform, string> = { instagram: "Instagram", tiktok: "TikTok", canva: "Canva" };
const PLATFORM_PLACEHOLDER: Record<GalleryPlatform, string> = {
  instagram: "https://www.instagram.com/p/...",
  tiktok: "https://www.tiktok.com/@.../video/...",
  canva: "https://www.canva.com/design/.../view?embed",
};

function AddPhotoForm({ onAdd }: { onAdd: (fields: { platform: GalleryPlatform; url: string; title: string; tag: string }) => Promise<void> }) {
  const [platform, setPlatform] = useState<GalleryPlatform>("instagram");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) return;
    setLoading(true);
    try {
      await onAdd({ platform, url: url.trim(), title: title.trim(), tag: tag.trim() });
      setUrl("");
      setTitle("");
      setTag("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <SelectField label="Plataforma" value={platform} onChange={(e) => setPlatform(e.target.value as GalleryPlatform)}>
          {GALLERY_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABEL[p]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Link do post"
          hint={platform === "canva" ? "Embed/iframe do Canva (a arte aparece direto, sem precisar de link do Instagram)." : undefined}
          type="url"
          placeholder={PLATFORM_PLACEHOLDER[platform]}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Título (opcional)" placeholder="Ex: Dia de rotina" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Tag (opcional)" placeholder="Ex: LOOKBOOK" maxLength={20} value={tag} onChange={(e) => setTag(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={loading} icon={<Plus className="size-4" aria-hidden />}>
          Adicionar foto
        </Button>
      </div>
    </form>
  );
}

function PhotoRow({
  photo,
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
  photo: GalleryPhoto;
  index: number;
  total: number;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onMove: (delta: number) => void;
  onEdit: (patch: Partial<Pick<GalleryPhoto, "platform" | "url" | "title" | "tag">>) => void;
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
      className={`glass flex flex-col gap-2 rounded-2xl p-3 transition sm:flex-row sm:items-center sm:gap-3 ${dragging ? "opacity-50" : ""}`}
    >
      <GripVertical className="hidden size-5 shrink-0 cursor-grab text-ink-faint sm:block" aria-hidden />

      <select
        value={photo.platform}
        onChange={(e) => onEdit({ platform: e.target.value as GalleryPlatform })}
        className="shrink-0 rounded-xl bg-white/70 px-2.5 py-2 text-sm font-semibold text-ink outline-none"
      >
        {GALLERY_PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {PLATFORM_LABEL[p]}
          </option>
        ))}
      </select>

      <div className="min-w-0 flex-1">
        <input
          key={`url-${photo.id}`}
          defaultValue={photo.url}
          placeholder="https://..."
          onBlur={(e) => e.target.value.trim() !== photo.url && onEdit({ url: e.target.value.trim() })}
          className="w-full truncate rounded-lg bg-transparent px-1 py-0.5 text-sm text-ink outline-none hover:bg-white/60 focus:bg-white"
        />
        <div className="flex items-center gap-2 px-1">
          <input
            key={`title-${photo.id}`}
            defaultValue={photo.title}
            placeholder="Título (opcional)"
            maxLength={80}
            onBlur={(e) => e.target.value.trim() !== photo.title && onEdit({ title: e.target.value.trim() })}
            className="min-w-0 flex-1 bg-transparent py-0.5 text-xs text-ink-soft outline-none placeholder:text-ink-faint hover:bg-white/60 focus:bg-white"
          />
          <input
            key={`tag-${photo.id}`}
            defaultValue={photo.tag}
            placeholder="Tag"
            maxLength={20}
            onBlur={(e) => e.target.value.trim() !== photo.tag && onEdit({ tag: e.target.value.trim() })}
            className="w-20 shrink-0 bg-transparent py-0.5 text-xs text-ink-soft outline-none placeholder:text-ink-faint hover:bg-white/60 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 self-end sm:self-auto">
        <a href={photo.url} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink" aria-label="Abrir link">
          <ExternalLink className="size-4" aria-hidden />
        </a>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink disabled:opacity-30" aria-label="Mover para cima">
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink disabled:opacity-30" aria-label="Mover para baixo">
          <ChevronDown className="size-4" aria-hidden />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <Button variant="danger" className="px-2.5 py-1 text-xs" onClick={onDelete}>
              Sim
            </Button>
            <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setConfirmDelete(false)}>
              Não
            </Button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full p-2 text-ink-soft hover:bg-danger-soft hover:text-danger" aria-label="Remover foto">
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

export default function GalleryManager({ projectId }: { projectId: string }) {
  const [photos, setPhotos] = useState<GalleryPhoto[] | null>(null);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    setPhotos(null);
    setError("");
    api<GalleryPhoto[]>(`/gallery-photos?project_id=${projectId}`)
      .then(setPhotos)
      .catch((e) => setError(errorMessage(e)));
  }, [projectId]);

  const saveOrder = async (next: GalleryPhoto[]) => {
    const before = photos;
    setPhotos(next);
    try {
      await api("/gallery-photos", { method: "PUT", body: { project_id: projectId, ids: next.map((p) => p.id) } });
    } catch (err) {
      setPhotos(before);
      setError(errorMessage(err));
    }
  };

  const move = (index: number, delta: number) => {
    if (!photos) return;
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  };

  const onDrop = (e: DragEvent, overId: string) => {
    e.preventDefault();
    if (!photos || !dragId || dragId === overId) return setDragId(null);
    const next = [...photos];
    const from = next.findIndex((p) => p.id === dragId);
    const to = next.findIndex((p) => p.id === overId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setDragId(null);
    saveOrder(next);
  };

  const addPhoto = async (fields: { platform: GalleryPlatform; url: string; title: string; tag: string }) => {
    const created = await api<GalleryPhoto>("/gallery-photos", { method: "POST", body: { project_id: projectId, ...fields } });
    setPhotos((list) => [...(list ?? []), created]);
  };

  const editPhoto = async (photo: GalleryPhoto, patch: Partial<Pick<GalleryPhoto, "platform" | "url" | "title" | "tag">>) => {
    const before = photos;
    setPhotos((list) => list?.map((p) => (p.id === photo.id ? { ...p, ...patch } : p)) ?? null);
    try {
      await api("/gallery-photos", { method: "PATCH", body: { id: photo.id, platform: photo.platform, url: photo.url, title: photo.title, tag: photo.tag, ...patch } });
    } catch (err) {
      setPhotos(before);
      setError(errorMessage(err));
    }
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    const before = photos;
    setPhotos((list) => list?.filter((p) => p.id !== photo.id) ?? null);
    try {
      await api(`/gallery-photos?id=${photo.id}`, { method: "DELETE" });
    } catch (err) {
      setPhotos(before);
      setError(errorMessage(err));
    }
  };

  if (photos === null && !error) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <div className="glass h-64 animate-pulse rounded-3xl" />
      </div>
    );
  }

  return (
    <GlassCard className="flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Fotos da galeria</h2>
        <p className="text-sm text-ink-soft">Cada foto é um link de um post — embeda igual aos vídeos, sem precisar subir arquivo.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <AddPhotoForm onAdd={addPhoto} />

      {photos?.length === 0 && <p className="text-sm text-ink-soft">Nenhuma foto ainda. Cole um link acima.</p>}

      {photos && photos.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {photos.map((photo, index) => (
            <PhotoRow
              key={photo.id}
              photo={photo}
              index={index}
              total={photos.length}
              dragging={dragId === photo.id}
              onDragStart={() => setDragId(photo.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, photo.id)}
              onMove={(delta) => move(index, delta)}
              onEdit={(patch) => editPhoto(photo, patch)}
              onDelete={() => deletePhoto(photo)}
            />
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
