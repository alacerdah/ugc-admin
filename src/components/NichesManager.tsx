import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Niche, VideoLink } from "../lib/types";
import { PLATFORM_LABEL, PLATFORMS, type Platform } from "../shared/platforms";
import { Alert, Button, GlassCard, SelectField, TextField } from "./ui";

// --- nichos (coluna da esquerda) -------------------------------------------------

function NicheList({
  niches,
  selectedId,
  onSelect,
  onReorder,
  onRename,
  onDelete,
  onAdd,
}: {
  niches: Niche[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (next: Niche[]) => void;
  onRename: (niche: Niche, name: string) => void;
  onDelete: (niche: Niche) => void;
  onAdd: (name: string) => Promise<void>;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const onDrop = (e: DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return setDragId(null);
    const next = [...niches];
    const from = next.findIndex((n) => n.id === dragId);
    const to = next.findIndex((n) => n.id === overId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setDragId(null);
    onReorder(next);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= niches.length) return;
    const next = [...niches];
    [next[index], next[target]] = [next[target], next[index]];
    onReorder(next);
  };

  const submitAdd = async (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await onAdd(name);
      setNewName("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <GlassCard className="flex flex-col gap-4 p-4">
      <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-ink-soft">Nichos</h2>

      {niches.length === 0 && <p className="px-1 text-sm text-ink-soft">Nenhum nicho ainda. Crie o primeiro abaixo.</p>}

      <ul className="flex flex-col gap-2">
        {niches.map((niche, index) => (
          <li
            key={niche.id}
            draggable
            onDragStart={() => setDragId(niche.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, niche.id)}
            className={`flex items-center gap-2 rounded-2xl p-2 pr-2.5 transition ${
              selectedId === niche.id ? "bg-gradient-to-r from-blue to-purple text-white" : "hover:bg-white/70"
            } ${dragId === niche.id ? "opacity-50" : ""}`}
          >
            <GripVertical className={`size-4 shrink-0 cursor-grab ${selectedId === niche.id ? "text-white/70" : "text-ink-faint"}`} aria-hidden />
            <input
              key={niche.name}
              defaultValue={niche.name}
              onClick={() => onSelect(niche.id)}
              onFocus={() => onSelect(niche.id)}
              onBlur={(e) => onRename(niche, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className={`min-w-0 flex-1 truncate bg-transparent text-left text-sm font-semibold outline-none ${selectedId === niche.id ? "placeholder:text-white/70" : "placeholder:text-ink-faint"}`}
            />
            <div className="flex shrink-0 items-center gap-0.5">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-full p-1.5 disabled:opacity-30" aria-label="Mover para cima">
                <ChevronUp className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === niches.length - 1}
                className="rounded-full p-1.5 disabled:opacity-30"
                aria-label="Mover para baixo"
              >
                <ChevronDown className="size-3.5" aria-hidden />
              </button>
              {confirmDelete === niche.id ? (
                <>
                  <button type="button" onClick={() => onDelete(niche)} className="rounded-full bg-danger px-2 py-1 text-xs font-bold text-white">
                    Sim
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-full px-2 py-1 text-xs font-bold">
                    Não
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(niche.id)} className="rounded-full p-1.5 hover:text-danger" aria-label="Remover nicho">
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submitAdd} className="flex items-center gap-2 border-t border-ink/5 pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Novo nicho (ex: Skincare)"
          maxLength={60}
          className="min-w-0 flex-1 rounded-xl bg-white/70 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:bg-white"
        />
        <Button type="submit" loading={adding} className="px-3 py-2" icon={<Plus className="size-4" aria-hidden />} aria-label="Adicionar nicho" />
      </form>
    </GlassCard>
  );
}

// --- links de vídeo do nicho selecionado (coluna da direita) --------------------

function AddLinkForm({ onAdd }: { onAdd: (fields: { platform: Platform; url: string; title: string; tag: string }) => Promise<void> }) {
  const [platform, setPlatform] = useState<Platform>("instagram");
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
        <SelectField label="Plataforma" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABEL[p]}
            </option>
          ))}
        </SelectField>
        <TextField label="Link" type="url" placeholder="https://www.tiktok.com/@.../video/..." value={url} onChange={(e) => setUrl(e.target.value)} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Título (opcional)" placeholder="Ex: Review do produto X" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Tag (opcional)" placeholder="Ex: REELS" maxLength={20} value={tag} onChange={(e) => setTag(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={loading} icon={<Plus className="size-4" aria-hidden />}>
          Adicionar link
        </Button>
      </div>
    </form>
  );
}

function LinkRow({
  link,
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
  link: VideoLink;
  index: number;
  total: number;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onMove: (delta: number) => void;
  onEdit: (patch: Partial<Pick<VideoLink, "platform" | "url" | "title" | "tag">>) => void;
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
        value={link.platform}
        onChange={(e) => onEdit({ platform: e.target.value as Platform })}
        className="shrink-0 rounded-xl bg-white/70 px-2.5 py-2 text-sm font-semibold text-ink outline-none"
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {PLATFORM_LABEL[p]}
          </option>
        ))}
      </select>

      <div className="min-w-0 flex-1">
        <input
          key={`url-${link.id}`}
          defaultValue={link.url}
          placeholder="https://..."
          onBlur={(e) => e.target.value.trim() !== link.url && onEdit({ url: e.target.value.trim() })}
          className="w-full truncate rounded-lg bg-transparent px-1 py-0.5 text-sm text-ink outline-none hover:bg-white/60 focus:bg-white"
        />
        <div className="flex items-center gap-2 px-1">
          <input
            key={`title-${link.id}`}
            defaultValue={link.title}
            placeholder="Título (opcional)"
            maxLength={80}
            onBlur={(e) => e.target.value.trim() !== link.title && onEdit({ title: e.target.value.trim() })}
            className="min-w-0 flex-1 bg-transparent py-0.5 text-xs text-ink-soft outline-none placeholder:text-ink-faint hover:bg-white/60 focus:bg-white"
          />
          <input
            key={`tag-${link.id}`}
            defaultValue={link.tag}
            placeholder="Tag"
            maxLength={20}
            onBlur={(e) => e.target.value.trim() !== link.tag && onEdit({ tag: e.target.value.trim() })}
            className="w-20 shrink-0 bg-transparent py-0.5 text-xs text-ink-soft outline-none placeholder:text-ink-faint hover:bg-white/60 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 self-end sm:self-auto">
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink" aria-label="Abrir link">
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
          <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full p-2 text-ink-soft hover:bg-danger-soft hover:text-danger" aria-label="Remover link">
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

function LinksPanel({ nicheId, nicheName }: { nicheId: string; nicheName: string }) {
  const [links, setLinks] = useState<VideoLink[] | null>(null);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    setLinks(null);
    setError("");
    api<VideoLink[]>(`/video-links?niche_id=${nicheId}`)
      .then(setLinks)
      .catch((e) => setError(errorMessage(e)));
  }, [nicheId]);

  const saveOrder = async (next: VideoLink[]) => {
    const before = links;
    setLinks(next);
    try {
      await api("/video-links", { method: "PUT", body: { niche_id: nicheId, ids: next.map((l) => l.id) } });
    } catch (err) {
      setLinks(before);
      setError(errorMessage(err));
    }
  };

  const move = (index: number, delta: number) => {
    if (!links) return;
    const target = index + delta;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  };

  const onDrop = (e: DragEvent, overId: string) => {
    e.preventDefault();
    if (!links || !dragId || dragId === overId) return setDragId(null);
    const next = [...links];
    const from = next.findIndex((l) => l.id === dragId);
    const to = next.findIndex((l) => l.id === overId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setDragId(null);
    saveOrder(next);
  };

  const addLink = async (fields: { platform: Platform; url: string; title: string; tag: string }) => {
    const created = await api<VideoLink>("/video-links", { method: "POST", body: { niche_id: nicheId, ...fields } });
    setLinks((list) => [...(list ?? []), created]);
  };

  const editLink = async (link: VideoLink, patch: Partial<Pick<VideoLink, "platform" | "url" | "title" | "tag">>) => {
    const before = links;
    setLinks((list) => list?.map((l) => (l.id === link.id ? { ...l, ...patch } : l)) ?? null);
    try {
      await api("/video-links", { method: "PATCH", body: { id: link.id, platform: link.platform, url: link.url, title: link.title, tag: link.tag, ...patch } });
    } catch (err) {
      setLinks(before);
      setError(errorMessage(err));
    }
  };

  const deleteLink = async (link: VideoLink) => {
    const before = links;
    setLinks((list) => list?.filter((l) => l.id !== link.id) ?? null);
    try {
      await api(`/video-links?id=${link.id}`, { method: "DELETE" });
    } catch (err) {
      setLinks(before);
      setError(errorMessage(err));
    }
  };

  return (
    <GlassCard className="flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Links de vídeo</h2>
        <p className="text-sm text-ink-soft">Nicho: {nicheName}</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <AddLinkForm onAdd={addLink} />

      {links === null && !error && (
        <div className="flex flex-col gap-3" aria-busy>
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="glass h-16 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {links?.length === 0 && <p className="text-sm text-ink-soft">Nenhum link neste nicho ainda. Cole um link acima.</p>}

      {links && links.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {links.map((link, index) => (
            <LinkRow
              key={link.id}
              link={link}
              index={index}
              total={links.length}
              dragging={dragId === link.id}
              onDragStart={() => setDragId(link.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, link.id)}
              onMove={(delta) => move(index, delta)}
              onEdit={(patch) => editLink(link, patch)}
              onDelete={() => deleteLink(link)}
            />
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

// --- composição: mestre (nichos) + detalhe (links do nicho selecionado) --------

export default function NichesManager({ projectId }: { projectId: string }) {
  const [niches, setNiches] = useState<Niche[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Niche[]>(`/niches?project_id=${projectId}`)
      .then((list) => {
        setNiches(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [projectId]);

  const selected = useMemo(() => niches?.find((n) => n.id === selectedId) ?? null, [niches, selectedId]);

  const reorderNiches = async (next: Niche[]) => {
    const before = niches;
    setNiches(next);
    try {
      await api("/niches", { method: "PUT", body: { project_id: projectId, ids: next.map((n) => n.id) } });
    } catch (err) {
      setNiches(before);
      setError(errorMessage(err));
    }
  };

  const addNiche = async (name: string) => {
    const created = await api<Niche>("/niches", { method: "POST", body: { project_id: projectId, name } });
    setNiches((list) => [...(list ?? []), created]);
    setSelectedId(created.id);
  };

  const renameNiche = async (niche: Niche, name: string) => {
    const value = name.trim();
    if (!value || value === niche.name) return;
    const before = niches;
    setNiches((list) => list?.map((n) => (n.id === niche.id ? { ...n, name: value } : n)) ?? null);
    try {
      await api("/niches", { method: "PATCH", body: { id: niche.id, name: value } });
    } catch (err) {
      setNiches(before);
      setError(errorMessage(err));
    }
  };

  const deleteNiche = async (niche: Niche) => {
    const before = niches;
    const next = niches?.filter((n) => n.id !== niche.id) ?? null;
    setNiches(next);
    if (selectedId === niche.id) setSelectedId(next?.[0]?.id ?? null);
    try {
      await api(`/niches?id=${niche.id}`, { method: "DELETE" });
    } catch (err) {
      setNiches(before);
      setError(errorMessage(err));
    }
  };

  if (niches === null && !error) {
    return (
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]" aria-busy>
        <div className="glass h-64 animate-pulse rounded-3xl" />
        <div className="glass h-64 animate-pulse rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start">
        <NicheList
          niches={niches ?? []}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={reorderNiches}
          onRename={renameNiche}
          onDelete={deleteNiche}
          onAdd={addNiche}
        />
        {selected ? (
          <LinksPanel key={selected.id} nicheId={selected.id} nicheName={selected.name} />
        ) : (
          <GlassCard className="flex items-center justify-center p-8 text-sm text-ink-soft">
            Crie um nicho pra começar a adicionar links de vídeo.
          </GlassCard>
        )}
      </div>
    </div>
  );
}
