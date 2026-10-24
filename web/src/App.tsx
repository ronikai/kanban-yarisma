import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Bookmark,
  CalendarDays,
  CircleHelp,
  CirclePlus,
  Command,
  Download,
  ImageDown,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Palette,
  Plus,
  RotateCcw,
  Search,
  ServerOff,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import { api } from './api';
import { CalendarView } from './components/CalendarView';
import { CardDialog, type Draft } from './components/CardDialog';
import { CardPreview } from './components/CardTile';
import { ColumnView } from './components/ColumnView';
import { CommandPalette, type PaletteItem } from './components/CommandPalette';
import { HelpDialog } from './components/HelpDialog';
import { SaveFilterDialog } from './components/SaveFilterDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { StatsBar } from './components/StatsBar';
import { TemplatesDialog } from './components/TemplatesDialog';
import { Toasts } from './components/Toasts';
import { burstConfetti, confettiEnabled } from './confetti';
import { dueToIso, labelSwatch } from './design';
import { setSoundEnabled, soundEnabled, sounds } from './sound';
import { TEMPLATES, type BoardTemplate } from './templates';
import { applyTheme, storedTheme, THEMES, type Theme } from './themes';
import { findCard, useKanban } from './useKanban';
import type { Card, SavedFilter, Toast, ViewMode } from './types';

export default function App() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((toast: Omit<Toast, 'id'>) => {
    if (toast.tone === 'error') sounds.error();
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((item) => item.id !== id)),
      toast.action ? 9000 : 4200,
    );
  }, []);

  const kanban = useKanban(notify);
  const {
    board,
    visible,
    labels,
    extras,
    matchCount,
    isFiltering,
    search,
    setSearch,
    labelFilter,
    setLabelFilter,
    overdueOnly,
    setOverdueOnly,
    isLoading,
    isError,
    refetch,
  } = kanban;

  const [editor, setEditor] = useState<{ columnId: string; card: Card | null } | null>(
    null,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => storedTheme());
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [view, setView] = useState<ViewMode>(() =>
    localStorage.getItem('pano-gorunum') === 'calendar' ? 'calendar' : 'board',
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saveFilterOpen, setSaveFilterOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const raw = localStorage.getItem('pano-kayitli-filtreler');
      return raw ? (JSON.parse(raw) as SavedFilter[]) : [];
    } catch {
      return [];
    }
  });
  const [soundOn, setSoundOn] = useState(() => soundEnabled());
  const [confettiOn, setConfettiOn] = useState(() => confettiEnabled());
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      return localStorage.getItem('pano-hareket') === 'az';
    } catch {
      return false;
    }
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const totalCards = useMemo(
    () =>
      board?.columns.reduce((total, column) => total + column.cards.length, 0) ?? 0,
    [board],
  );

  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let checklistDone = 0;
    let checklistTotal = 0;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const week = new Date(start);
    week.setDate(week.getDate() + 7);

    board?.columns.forEach((column) =>
      column.cards.forEach((card) => {
        if (card.dueDate) {
          const due = new Date(card.dueDate);
          if (!Number.isNaN(due.getTime())) {
            if (due < start) overdue += 1;
            else if (due <= week) dueSoon += 1;
          }
        }
        const extra = extras[card.id];
        if (extra) {
          for (const item of extra.checklist) {
            checklistTotal += 1;
            if (item.done) checklistDone += 1;
          }
        }
      }),
    );

    return { total: totalCards, overdue, dueSoon, checklistDone, checklistTotal };
  }, [board, extras, totalCards]);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'normal';
    try {
      localStorage.setItem('pano-hareket', reducedMotion ? 'az' : 'normal');
    } catch {
      /* yoksay */
    }
  }, [reducedMotion]);

  useEffect(() => {
    try {
      localStorage.setItem('pano-gorunum', view);
    } catch {
      /* yoksay */
    }
  }, [view]);

  const editorColumn =
    board?.columns.find((column) => column.id === editor?.columnId) ?? null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      const target = event.target as HTMLElement | null;
      const typing = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable),
      );

      if (event.key === 'Escape') {
        if (paletteOpen) {
          setPaletteOpen(false);
          return;
        }
        if (templatesOpen) {
          setTemplatesOpen(false);
          return;
        }
        if (saveFilterOpen) {
          setSaveFilterOpen(false);
          return;
        }
        if (editor) {
          setEditor(null);
          return;
        }
        if (helpOpen) {
          setHelpOpen(false);
          return;
        }
        if (addingColumn) {
          setAddingColumn(false);
          return;
        }
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (typing) target?.blur();
        return;
      }

      if (
        typing ||
        editor ||
        helpOpen ||
        settingsOpen ||
        paletteOpen ||
        templatesOpen ||
        saveFilterOpen
      ) {
        return;
      }

      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        const first = board?.columns[0];
        if (first) setEditor({ columnId: first.id, card: null });
      } else if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === '?') {
        event.preventDefault();
        setHelpOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    board,
    editor,
    helpOpen,
    settingsOpen,
    addingColumn,
    paletteOpen,
    templatesOpen,
    saveFilterOpen,
  ]);

  const chooseTheme = (next: Theme) => {
    applyTheme(next);
    setTheme(next);
  };

  const handleExportPng = async () => {
    const node = boardRef.current;
    if (!node) {
      notify({ tone: 'error', message: 'Dışa aktarılacak pano bulunamadı' });
      return;
    }
    try {
      const { toPng } = await import('html-to-image');
      const width = Math.max(node.scrollWidth, node.clientWidth);
      const height = Math.max(node.scrollHeight, node.clientHeight);
      const background = getComputedStyle(document.body).backgroundColor;
      const options = {
        pixelRatio: 2,
        backgroundColor: background,
        width,
        height,
        skipFonts: true,
        style: { width: `${width}px`, height: `${height}px` },
      };
      const dataUrl = await toPng(node, options);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `pano-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
      notify({ tone: 'success', message: 'Pano PNG olarak indirildi' });
      sounds.success();
    } catch (error) {
      notify({
        tone: 'error',
        message: error instanceof Error ? error.message : 'PNG oluşturulamadı',
      });
    }
  };

  const handleUseTemplate = (template: BoardTemplate) => {
    if (
      !window.confirm(
        `“${template.name}” şablonu mevcut panonun yerine yüklenecek. Devam edilsin mi?`,
      )
    ) {
      return;
    }
    kanban.importBoard.mutate(template.build());
    setTemplatesOpen(false);
    setView('board');
    sounds.success();
  };

  const persistFilters = (list: SavedFilter[]) => {
    setSavedFilters(list);
    try {
      localStorage.setItem('pano-kayitli-filtreler', JSON.stringify(list));
    } catch {
      /* yoksay */
    }
  };

  const handleSaveFilter = (name: string) => {
    const filter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      q: search,
      label: labelFilter,
      overdue: overdueOnly,
    };
    persistFilters([
      ...savedFilters.filter((item) => item.name !== name),
      filter,
    ].slice(-12));
    setSaveFilterOpen(false);
    notify({ tone: 'success', message: `“${name}” filtresi kaydedildi` });
  };

  const applySavedFilter = (filter: SavedFilter) => {
    setSearch(filter.q);
    setLabelFilter(filter.label);
    setOverdueOnly(filter.overdue);
  };

  const removeSavedFilter = (id: string) => {
    persistFilters(savedFilters.filter((item) => item.id !== id));
  };

  const filterName =
    [labelFilter, overdueOnly ? 'geciken' : '', search.trim()]
      .filter(Boolean)
      .join(' · ') || 'Filtrem';

  const handleSave = (draft: Draft, columnId: string) => {
    const patch = {
      title: draft.title,
      description: draft.description || null,
      label: draft.label || null,
      dueDate: dueToIso(draft.dueDate),
    };
    if (editor?.card) {
      kanban.updateCard.mutate({ id: editor.card.id, patch });
      notify({ tone: 'success', message: 'Kart güncellendi' });
    } else {
      kanban.createCard.mutate({ columnId, ...patch });
    }
    setEditor(null);
  };

  const handleDeleteFromDialog = () => {
    if (!editor?.card || !board) return;
    const column = board.columns.find((item) => item.id === editor.columnId);
    const index = column?.cards.findIndex((card) => card.id === editor.card?.id) ?? 0;
    kanban.deleteCard.mutate({
      card: editor.card,
      columnId: editor.columnId,
      index: Math.max(0, index),
    });
    setEditor(null);
  };

  const handleDeleteCard = (card: Card, columnId: string, index: number) => {
    kanban.deleteCard.mutate({ card, columnId, index });
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = board?.columns.find((item) => item.id === columnId);
    if (!column) return;
    if (
      window.confirm(
        `"${column.title}" kolonu ve içindeki ${column.cards.length} kart silinsin mi?`,
      )
    ) {
      kanban.deleteColumn.mutate(columnId);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (!board) return;
    sounds.pick();
    const found = findCard(board, String(event.active.id));
    setActiveCard(found?.card ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    if (!board || !event.over) return;

    const overData = event.over.data.current as
      | { type?: string; columnId?: string }
      | undefined;
    const targetColumnId = overData?.columnId;
    if (!targetColumnId) return;

    const target = board.columns.find((column) => column.id === targetColumnId);
    if (!target) return;

    const activeId = String(event.active.id);
    const source = findCard(board, activeId);
    if (!source) return;

    let toIndex = target.cards.length;
    if (overData?.type === 'card') {
      const overIndex = target.cards.findIndex(
        (card) => card.id === String(event.over?.id),
      );
      if (overIndex >= 0) toIndex = overIndex;
    }

    if (source.column.id === targetColumnId) {
      const fromIndex = target.cards.findIndex((card) => card.id === activeId);
      if (fromIndex === toIndex) return;
    }

    kanban.moveCard.mutate({ cardId: activeId, toColumnId: targetColumnId, toIndex });
    sounds.drop();
    if (/(bitti|done|tamam|yayında|yayinda)/i.test(target.title)) {
      burstConfetti();
      sounds.success();
    }
  };

  const submitColumn = (event: React.FormEvent) => {
    event.preventDefault();
    const title = columnTitle.trim();
    if (!title) return;
    kanban.createColumn.mutate(title);
    setColumnTitle('');
    setAddingColumn(false);
  };

  const handleExport = async () => {
    try {
      const data = await api.exportBoard();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pano-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify({ tone: 'success', message: 'Yedek indirildi' });
    } catch (error) {
      notify({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Yedek alınamadı',
      });
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const candidate = parsed?.board ?? parsed;
      if (!candidate?.columns) throw new Error('Dosyada board.columns bulunamadı');
      kanban.importBoard.mutate(candidate);
    } catch (error) {
      notify({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Dosya okunamadı',
      });
    }
  };

  const paletteItems: PaletteItem[] = [
    {
      id: 'new-card',
      label: 'Yeni kart',
      hint: 'İlk kolona kart ekle',
      group: 'Komutlar',
      icon: <Plus size={15} />,
      keywords: 'ekle kart',
      run: () => {
        const first = board?.columns[0];
        if (first) setEditor({ columnId: first.id, card: null });
      },
    },
    {
      id: 'new-column',
      label: 'Yeni kolon',
      hint: 'Panoya kolon ekle',
      group: 'Komutlar',
      icon: <CirclePlus size={15} />,
      keywords: 'kolon ekle',
      run: () => setAddingColumn(true),
    },
    {
      id: 'templates',
      label: 'Şablon panolar',
      hint: 'Sprint, içerik takvimi, kişisel',
      group: 'Komutlar',
      icon: <LayoutTemplate size={15} />,
      keywords: 'şablon hazır pano',
      run: () => setTemplatesOpen(true),
    },
    {
      id: 'view-board',
      label: 'Pano görünümü',
      group: 'Görünüm',
      icon: <LayoutGrid size={15} />,
      keywords: 'kanban board',
      run: () => setView('board'),
    },
    {
      id: 'view-calendar',
      label: 'Takvim görünümü',
      group: 'Görünüm',
      icon: <CalendarDays size={15} />,
      keywords: 'takvim tarih',
      run: () => setView('calendar'),
    },
    {
      id: 'export-png',
      label: 'PNG olarak indir',
      hint: 'Panonun görüntüsünü kaydet',
      group: 'Komutlar',
      icon: <ImageDown size={15} />,
      keywords: 'resim görüntü',
      run: () => void handleExportPng(),
    },
    {
      id: 'export-json',
      label: 'JSON yedeği indir',
      hint: 'Panoyu dosyaya aktar',
      group: 'Komutlar',
      icon: <Download size={15} />,
      keywords: 'yedek dışa aktar',
      run: () => void handleExport(),
    },
    ...(isFiltering
      ? [
          {
            id: 'save-filter',
            label: 'Filtreyi kaydet',
            hint: filterName,
            group: 'Komutlar',
            icon: <Bookmark size={15} />,
            keywords: 'kaydet görünüm',
            run: () => setSaveFilterOpen(true),
          } satisfies PaletteItem,
        ]
      : []),
    {
      id: 'settings',
      label: 'Görünüm ayarları',
      hint: 'Renk paleti, ses, konfeti',
      group: 'Komutlar',
      icon: <Settings size={15} />,
      keywords: 'tema renk ayar',
      run: () => setSettingsOpen(true),
    },
    {
      id: 'help',
      label: 'Klavye kısayolları',
      group: 'Komutlar',
      icon: <CircleHelp size={15} />,
      keywords: 'yardım kısayol',
      run: () => setHelpOpen(true),
    },
    ...TEMPLATES.map((template) => ({
      id: `template-${template.id}`,
      label: `Şablon: ${template.name}`,
      hint: template.note,
      group: 'Şablonlar',
      icon: <LayoutTemplate size={15} />,
      keywords: 'pano hazır',
      run: () => handleUseTemplate(template),
    })),
    ...THEMES.map((item) => ({
      id: `theme-${item.id}`,
      label: `Tema: ${item.name}`,
      hint: item.note,
      group: 'Temalar',
      icon: <Palette size={15} />,
      keywords: 'renk palet tema',
      run: () => chooseTheme(item),
    })),
    ...(board?.columns.flatMap((column) =>
      column.cards.map((card) => ({
        id: `card-${card.id}`,
        label: card.title,
        hint: column.title,
        group: 'Kartlar',
        icon: <Layers size={15} />,
        keywords: card.label ?? '',
        run: () => setEditor({ columnId: column.id, card }),
      })),
    ) ?? []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1720px] flex-wrap items-center gap-3 px-4 py-3 md:px-7">
          <div className="mr-auto flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink shadow-[0_2px_6px_rgba(34,28,23,0.24)]">
              <div className="flex items-end gap-[3px]">
                <span className="h-5 w-[5px] rounded-full bg-coral" />
                <span className="h-3.5 w-[5px] rounded-full bg-amber" />
                <span className="h-6 w-[5px] rounded-full bg-mint" />
              </div>
            </div>
            <div>
              <span className="inline-flex items-center rounded-full bg-coral-soft px-2 py-[3px] text-[10px] font-extrabold tracking-[0.02em] text-coral">
                Yarışma 01 · Kanban
              </span>
              <h1 className="mt-1 font-display text-[24px] font-bold leading-none tracking-[-0.01em]">
                Pano<span className="text-coral">.</span>
              </h1>
            </div>
          </div>

          <div className="relative order-3 w-full md:order-none md:w-[320px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Kart, açıklama veya etiket ara…"
              aria-label="Kart ara"
              className="field bg-surface/90 pl-9 pr-11"
            />
            {search ? (
              <button
                type="button"
                aria-label="Aramayı temizle"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-paper-2 hover:text-ink"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                <kbd className="kbd">/</kbd>
              </span>
            )}
          </div>

          <div className="flex items-center rounded-xl border border-line-2 bg-surface/80 p-0.5">
            <button
              type="button"
              aria-label="Pano görünümü"
              aria-pressed={view === 'board'}
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 rounded-[9px] px-2.5 py-2 text-[12px] font-bold transition ${
                view === 'board'
                  ? 'bg-ink text-paper shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutGrid size={15} />
              <span className="hidden lg:inline">Pano</span>
            </button>
            <button
              type="button"
              aria-label="Takvim görünümü"
              aria-pressed={view === 'calendar'}
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 rounded-[9px] px-2.5 py-2 text-[12px] font-bold transition ${
                view === 'calendar'
                  ? 'bg-ink text-paper shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <CalendarDays size={15} />
              <span className="hidden lg:inline">Takvim</span>
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            aria-label="Komut paleti"
            title="Komut paleti (Ctrl+K)"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-10 w-10 place-items-center rounded-xl border border-line-2 bg-surface/80 text-muted transition hover:border-ink/20 hover:text-ink sm:grid"
          >
            <Command size={17} />
          </button>

          <button
            type="button"
            aria-label="Panoyu PNG olarak indir"
            title="PNG olarak indir"
            onClick={() => void handleExportPng()}
            className="hidden h-10 w-10 place-items-center rounded-xl border border-line-2 bg-surface/80 text-muted transition hover:border-ink/20 hover:text-ink lg:grid"
          >
            <ImageDown size={17} />
          </button>

          <button
            type="button"
            aria-label="Panoyu JSON olarak indir"
            title="Yedek al"
            onClick={() => void handleExport()}
            className="hidden h-10 w-10 place-items-center rounded-xl border border-line-2 bg-surface/80 text-muted transition hover:border-ink/20 hover:text-ink sm:grid"
          >
            <Download size={17} />
          </button>

          <button
            type="button"
            aria-label="JSON dosyasından pano yükle"
            title="Yedekten yükle"
            onClick={() => fileRef.current?.click()}
            className="hidden h-10 w-10 place-items-center rounded-xl border border-line-2 bg-surface/80 text-muted transition hover:border-ink/20 hover:text-ink sm:grid"
          >
            <Upload size={17} />
          </button>

          <button
            type="button"
            aria-label="Görünüm ayarları"
            title="Görünüm"
            onClick={() => setSettingsOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line-2 bg-surface/80 text-muted transition hover:border-ink/20 hover:text-ink"
          >
            <Settings size={18} />
          </button>

          <button
            type="button"
            aria-label="Klavye kısayolları"
            onClick={() => setHelpOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line-2 bg-surface/80 text-muted transition hover:border-ink/20 hover:text-ink"
          >
            <CircleHelp size={18} />
          </button>

          <button
            type="button"
            onClick={() => setAddingColumn(true)}
            className="btn btn-coral"
          >
            <Plus size={16} strokeWidth={2.6} /> Yeni kolon
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1720px] flex-1 flex-col px-4 pb-14 pt-5 md:px-7">
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1.5 text-[12px] font-extrabold text-muted">Etiket</span>
          <button
            type="button"
            onClick={() => setLabelFilter(null)}
            className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${
              labelFilter === null
                ? 'border-ink bg-ink text-paper'
                : 'border-line-2 bg-surface/70 text-ink-2 hover:border-ink/25'
            }`}
          >
            Tümü
          </button>
          {labels.map((label) => {
            const swatch = labelSwatch(label);
            const active = labelFilter === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setLabelFilter(active ? null : label)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition hover:brightness-[0.97]"
                style={
                  active
                    ? { background: swatch.dot, borderColor: swatch.dot, color: 'var(--color-on-accent)' }
                    : { background: swatch.bg, borderColor: swatch.line, color: swatch.fg }
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: active ? 'var(--color-on-accent)' : swatch.dot }}
                />
                {label}
              </button>
            );
          })}

          <button
            type="button"
            aria-pressed={overdueOnly}
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${
              overdueOnly
                ? 'border-coral bg-coral text-[var(--color-on-accent)]'
                : 'border-line-2 bg-surface/70 text-ink-2 hover:border-coral/40 hover:text-coral'
            }`}
          >
            <CalendarDays size={12} /> Geciken
          </button>

          <div className="ml-auto flex items-center gap-2">
            {isFiltering ? (
              <>
                <button
                  type="button"
                  onClick={() => setSaveFilterOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-surface/80 px-2.5 py-1.5 text-[12px] font-semibold text-ink-2 transition hover:border-ink/25"
                >
                  <Bookmark size={13} />
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setLabelFilter(null);
                    setOverdueOnly(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-surface/80 px-2.5 py-1.5 text-[12px] font-semibold text-ink-2 transition hover:border-ink/25"
                >
                  <RotateCcw size={13} />
                  Temizle
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line-2/80 bg-surface/70 px-2.5 py-1.5 font-mono text-[11px] font-bold text-muted">
                <Layers size={13} />
                {board?.columns.length ?? 0} kolon, {totalCards} kart
              </span>
            )}
          </div>
        </div>

        {savedFilters.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-bold text-muted">
              <Bookmark size={12} /> Kayıtlı
            </span>
            {savedFilters.map((filter) => (
              <span
                key={filter.id}
                className="inline-flex items-center overflow-hidden rounded-lg border border-line-2 bg-surface/70"
              >
                <button
                  type="button"
                  onClick={() => applySavedFilter(filter)}
                  className="px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-2 transition hover:text-ink"
                >
                  {filter.name}
                </button>
                <button
                  type="button"
                  aria-label={`${filter.name} filtresini sil`}
                  onClick={() => removeSavedFilter(filter.id)}
                  className="grid h-7 w-6 place-items-center text-faint transition hover:text-coral"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {isFiltering && (
          <p className="mb-3 text-[12.5px] text-muted">
            <span className="font-semibold text-ink">{matchCount} kart</span> eşleşti
            {search.trim() && (
              <>
                {' '}
                · “<span className="font-medium text-ink-2">{search.trim()}</span>”
              </>
            )}
            {labelFilter && <> · etiket: {labelFilter}</>}
            {overdueOnly && <> · yalnız gecikenler</>}
          </p>
        )}

        {board && <StatsBar {...stats} />}

        {isLoading && (
          <div className="flex gap-4 overflow-hidden pb-8">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="w-[300px] shrink-0 rounded-2xl border border-line/70 bg-surface/40 p-3"
              >
                <div className="mb-3 h-4 w-28 animate-pulse rounded-md bg-paper-3" />
                {[0, 1, 2].map((card) => (
                  <div
                    key={card}
                    className="mb-2 h-24 animate-pulse rounded-xl bg-surface/70"
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="mx-auto grid w-full max-w-lg place-items-center rounded-2xl border border-coral/25 bg-surface px-6 py-14 text-center shadow-lift">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral-soft text-coral">
              <ServerOff size={22} />
            </span>
            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
              Pano yüklenemedi
            </h2>
            <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted">
              API'ye ulaşamadım. <b className="text-ink-2">api</b> tarafının{' '}
              <b className="text-ink-2">:3001</b> portunda çalıştığından emin ol; kökte{' '}
              <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-[12px]">
                npm run dev
              </code>{' '}
              yeterli.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="btn btn-primary mt-5"
            >
              <RotateCcw size={15} /> Tekrar dene
            </button>
          </div>
        )}

        {board && visible && (
          <div ref={boardRef} className="min-w-0 flex-1">
            {view === 'board' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveCard(null)}
          >
            <div className="flex flex-1 animate-rise items-start gap-4 overflow-x-auto pb-8">
              {visible.columns.map((column, index) => (
                <ColumnView
                  key={column.id}
                  column={column}
                  index={index}
                  isFiltering={isFiltering}
                  extras={extras}
                  onAddCard={(columnId) =>
                    setEditor({ columnId, card: null })
                  }
                  onOpenCard={(card, columnId) => setEditor({ columnId, card })}
                  onDeleteCard={handleDeleteCard}
                  onDeleteColumn={(item) => handleDeleteColumn(item.id)}
                  onRenameColumn={(columnId, title) =>
                    kanban.updateColumn.mutate({ id: columnId, title })
                  }
                />
              ))}

              {board.columns.length === 0 && !addingColumn && (
                <div className="grid w-full max-w-xl place-items-center rounded-2xl border border-dashed border-line-2 bg-surface/60 px-6 py-14 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-soft text-amber">
                    <Layers size={22} />
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
                    Pano bomboş
                  </h2>
                  <p className="mt-2 max-w-sm text-[13.5px] text-muted">
                    İlk kolonunu oluştur, sonra kartları sürüklemeye başla.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddingColumn(true)}
                    className="btn btn-coral mt-5"
                  >
                    <Plus size={16} /> İlk kolonu ekle
                  </button>
                </div>
              )}

              {addingColumn ? (
                <form
                  onSubmit={submitColumn}
                  className="w-[300px] shrink-0 rounded-2xl border border-line-2 bg-surface p-3 shadow-lift"
                >
                  <label
                    htmlFor="new-column"
                    className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted"
                  >
                    Yeni kolon
                  </label>
                  <input
                    id="new-column"
                    autoFocus
                    value={columnTitle}
                    onChange={(event) => setColumnTitle(event.target.value)}
                    placeholder="ör. Bu hafta"
                    maxLength={500}
                    className="field"
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setAddingColumn(false);
                    }}
                  />
                  <div className="mt-2 flex gap-2">
                    <button type="submit" className="btn btn-primary flex-1 justify-center">
                      Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingColumn(false);
                        setColumnTitle('');
                      }}
                      className="btn btn-ghost border border-line-2"
                    >
                      Vazgeç
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingColumn(true)}
                  className="flex w-[300px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-4 py-5 text-[13px] font-semibold text-muted transition hover:border-ink/25 hover:bg-surface/70 hover:text-ink"
                >
                  <CirclePlus size={17} /> Yeni kolon
                </button>
              )}
            </div>

            <DragOverlay>
              {activeCard ? (
                <CardPreview card={activeCard} extra={extras[activeCard.id]} />
              ) : null}
            </DragOverlay>
          </DndContext>
            ) : (
              <CalendarView
                board={board}
                onOpenCard={(card, columnId) =>
                  setEditor({ columnId, card })
                }
              />
            )}
          </div>
        )}

        <footer className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line/70 pt-4 text-[11px] font-semibold text-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" /> SQLite · kalıcı
          </span>
          <span className="text-line-2">/</span>
          <span>API :3001</span>
          <span className="text-line-2">/</span>
          <span>her şey sunucuda</span>
          <span className="ml-auto">Sürükle, bırak, akışta kal.</span>
        </footer>
      </main>

      <CardDialog
        open={Boolean(editor)}
        column={editorColumn}
        card={editor?.card ?? null}
        extra={editor?.card ? extras[editor.card.id] : undefined}
        labels={labels}
        onClose={() => setEditor(null)}
        onSave={handleSave}
        onDelete={editor?.card ? handleDeleteFromDialog : undefined}
        onMeta={(patch) => {
          if (!editor?.card) return;
          kanban.setCardMeta.mutate({ id: editor.card.id, ...patch });
        }}
        onAddChecklist={(text) => {
          if (!editor?.card) return;
          kanban.addChecklist.mutate({ cardId: editor.card.id, text });
        }}
        onToggleChecklist={(itemId, done) => {
          kanban.toggleChecklist.mutate({ itemId, done });
          if (done) sounds.check();
        }}
        onDeleteChecklist={(itemId) => {
          if (!editor?.card) return;
          kanban.deleteChecklist.mutate({ cardId: editor.card.id, itemId });
        }}
      />

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

      <SettingsDialog
        open={settingsOpen}
        activeId={theme.id}
        sound={soundOn}
        confetti={confettiOn}
        reducedMotion={reducedMotion}
        onSelect={chooseTheme}
        onToggle={(key, value) => {
          if (key === 'sound') {
            setSoundOn(value);
            setSoundEnabled(value);
          } else if (key === 'confetti') {
            setConfettiOn(value);
            try {
              localStorage.setItem('pano-konfeti', value ? '1' : '0');
            } catch {
              /* yoksay */
            }
          } else {
            setReducedMotion(value);
          }
        }}
        onClose={() => setSettingsOpen(false)}
      />

      <CommandPalette
        open={paletteOpen}
        items={paletteItems}
        onClose={() => setPaletteOpen(false)}
      />

      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onUse={handleUseTemplate}
      />

      <SaveFilterDialog
        open={saveFilterOpen}
        initialName={filterName}
        onClose={() => setSaveFilterOpen(false)}
        onSave={handleSaveFilter}
      />

      <Toasts
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
      />
    </div>
  );
}
