import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project, Faction, NPC, Mission, NarrativeItem, Document,
  EconomyProfile, TimelineEvent, AIGenerationResult, Relation, AppState, AppCustomization
} from '../../../shared/types';
import { ALL_DEMO_DATA } from '../data/demoData';
import { MIRAGE_PROJECT_ID } from '../lib/project';

interface StoreState extends AppState {
  updateCustomization: (data: Partial<AppCustomization>) => void;

  // Project actions
  setCurrentProject: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Faction actions
  addFaction: (faction: Omit<Faction, 'id' | 'createdAt' | 'updatedAt'>) => Faction;
  updateFaction: (id: string, data: Partial<Faction>) => void;
  deleteFaction: (id: string) => void;

  // NPC actions
  addNpc: (npc: Omit<NPC, 'id' | 'createdAt' | 'updatedAt'>) => NPC;
  updateNpc: (id: string, data: Partial<NPC>) => void;
  deleteNpc: (id: string) => void;

  // Mission actions
  addMission: (mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>) => Mission;
  updateMission: (id: string, data: Partial<Mission>) => void;
  deleteMission: (id: string) => void;

  // Item actions
  addItem: (item: Omit<NarrativeItem, 'id' | 'createdAt' | 'updatedAt'>) => NarrativeItem;
  updateItem: (id: string, data: Partial<NarrativeItem>) => void;
  deleteItem: (id: string) => void;

  // Document actions
  addDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Document;
  updateDocument: (id: string, data: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  // Economy actions
  upsertEconomy: (economy: Omit<EconomyProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;

  // Timeline actions
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>) => TimelineEvent;
  updateTimelineEvent: (id: string, data: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;

  // AI results
  addAiResult: (result: Omit<AIGenerationResult, 'id' | 'createdAt'>) => AIGenerationResult;
  markAiResultSaved: (id: string) => void;
  deleteAiResult: (id: string) => void;

  // Relations
  addRelation: (relation: Omit<Relation, 'id'>) => void;
  deleteRelation: (id: string) => void;

  // Computed getters
  getCurrentProject: () => Project | null;
  getProjectFactions: (projectId: string) => Faction[];
  getProjectNpcs: (projectId: string) => NPC[];
  getProjectMissions: (projectId: string) => Mission[];
  getProjectItems: (projectId: string) => NarrativeItem[];
  getProjectDocuments: (projectId: string) => Document[];
  getProjectEconomy: (projectId: string) => EconomyProfile | null;
  getProjectTimeline: (projectId: string) => TimelineEvent[];
  getProjectAiResults: (projectId: string) => AIGenerationResult[];

  // Import / Export
  exportData: () => string;
  importData: (jsonString: string) => void;
  resetToDemo: () => void;
}

const now = () => new Date().toISOString();

function safeText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  if (Array.isArray(value)) return value.map((entry) => safeText(entry)).filter(Boolean).join('\n\n');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const text = safeText(entry);
        return text ? `${key}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  return String(value);
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function sanitizeAiResult(result: Partial<AIGenerationResult>): AIGenerationResult {
  return {
    id: safeText(result.id, uuidv4()),
    projectId: result.projectId ? safeText(result.projectId) : undefined,
    requestId: result.requestId ? safeText(result.requestId) : undefined,
    title: safeText(result.title, 'Output AI'),
    strategicSummary: safeText(result.strategicSummary),
    fullNarrative: safeText(result.fullNarrative),
    designReasoning: safeText(result.designReasoning),
    economyAnalysis: result.economyAnalysis ? safeText(result.economyAnalysis) : undefined,
    expertNotes: result.expertNotes ? safeText(result.expertNotes) : undefined,
    coherenceWarnings: safeArray(result.coherenceWarnings),
    abuseWarnings: safeArray(result.abuseWarnings),
    suggestedLinks: safeArray(result.suggestedLinks),
    alternatives: safeArray<unknown>(result.alternatives).map((entry) => safeText(entry)).filter(Boolean),
    factions: safeArray(result.factions),
    npcs: safeArray(result.npcs),
    missions: safeArray(result.missions),
    items: safeArray(result.items),
    documents: safeArray(result.documents),
    timelineEvents: safeArray(result.timelineEvents),
    createdAt: safeText(result.createdAt, now()),
    savedToCodex: Boolean(result.savedToCodex),
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state with demo data
      ...ALL_DEMO_DATA,

      updateCustomization: (data) =>
        set((s) => ({
          customization: { ...s.customization, ...data },
        })),

      // ─── Project actions ───────────────────────────────────────────────
      setCurrentProject: (id) => set({ currentProjectId: id }),

      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: uuidv4(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ projects: [...s.projects, newProject] }));
        return newProject;
      },

      updateProject: (id, data) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now() } : p
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
        })),

      // ─── Faction actions ───────────────────────────────────────────────
      addFaction: (faction) => {
        const f: Faction = { ...faction, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ factions: [...s.factions, f] }));
        return f;
      },

      updateFaction: (id, data) =>
        set((s) => ({
          factions: s.factions.map((f) =>
            f.id === id ? { ...f, ...data, updatedAt: now() } : f
          ),
        })),

      deleteFaction: (id) =>
        set((s) => ({ factions: s.factions.filter((f) => f.id !== id) })),

      // ─── NPC actions ───────────────────────────────────────────────────
      addNpc: (npc) => {
        const n: NPC = { ...npc, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ npcs: [...s.npcs, n] }));
        return n;
      },

      updateNpc: (id, data) =>
        set((s) => ({
          npcs: s.npcs.map((n) => (n.id === id ? { ...n, ...data, updatedAt: now() } : n)),
        })),

      deleteNpc: (id) =>
        set((s) => ({ npcs: s.npcs.filter((n) => n.id !== id) })),

      // ─── Mission actions ───────────────────────────────────────────────
      addMission: (mission) => {
        const m: Mission = { ...mission, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ missions: [...s.missions, m] }));
        return m;
      },

      updateMission: (id, data) =>
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: now() } : m
          ),
        })),

      deleteMission: (id) =>
        set((s) => ({ missions: s.missions.filter((m) => m.id !== id) })),

      // ─── Item actions ──────────────────────────────────────────────────
      addItem: (item) => {
        const i: NarrativeItem = { ...item, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ items: [...s.items, i] }));
        return i;
      },

      updateItem: (id, data) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...data, updatedAt: now() } : i)),
        })),

      deleteItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      // ─── Document actions ──────────────────────────────────────────────
      addDocument: (doc) => {
        const d: Document = { ...doc, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ documents: [...s.documents, d] }));
        return d;
      },

      updateDocument: (id, data) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: now() } : d
          ),
        })),

      deleteDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      // ─── Economy ───────────────────────────────────────────────────────
      upsertEconomy: (economy) => {
        const existing = get().economyProfiles[0];
        if (existing) {
          set({ economyProfiles: [{ ...existing, ...economy, updatedAt: now() }] });
        } else {
          const e: EconomyProfile = { ...economy, id: uuidv4(), createdAt: now(), updatedAt: now() };
          set({ economyProfiles: [e] });
        }
      },

      // ─── Timeline ─────────────────────────────────────────────────────
      addTimelineEvent: (event) => {
        const t: TimelineEvent = { ...event, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ timelineEvents: [...s.timelineEvents, t] }));
        return t;
      },

      updateTimelineEvent: (id, data) =>
        set((s) => ({
          timelineEvents: s.timelineEvents.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: now() } : t
          ),
        })),

      deleteTimelineEvent: (id) =>
        set((s) => ({ timelineEvents: s.timelineEvents.filter((t) => t.id !== id) })),

      // ─── AI Results ───────────────────────────────────────────────────
      addAiResult: (result) => {
        const r = sanitizeAiResult({ ...result, id: uuidv4(), createdAt: now() });
        set((s) => ({ aiResults: [r, ...s.aiResults] }));
        return r;
      },

      markAiResultSaved: (id) =>
        set((s) => ({
          aiResults: s.aiResults.map((r) => (r.id === id ? { ...r, savedToCodex: true } : r)),
        })),

      deleteAiResult: (id) =>
        set((s) => ({ aiResults: s.aiResults.filter((r) => r.id !== id) })),

      // ─── Relations ────────────────────────────────────────────────────
      addRelation: (relation) => {
        const r: Relation = { ...relation, id: uuidv4() };
        set((s) => ({ relations: [...s.relations, r] }));
      },

      deleteRelation: (id) =>
        set((s) => ({ relations: s.relations.filter((r) => r.id !== id) })),

      // ─── Computed getters ─────────────────────────────────────────────
      getCurrentProject: () => {
        const { currentProjectId, projects } = get();
        return projects.find((p) => p.id === currentProjectId) ?? null;
      },

      getProjectFactions: (pid) => get().factions.filter((f) => f.projectId === pid),
      getProjectNpcs: (pid) => get().npcs.filter((n) => n.projectId === pid),
      getProjectMissions: () => get().missions,
      getProjectItems: () => get().items,
      getProjectDocuments: () => get().documents,
      getProjectEconomy: () => get().economyProfiles[0] ?? null,
      getProjectTimeline: (pid) =>
        get().timelineEvents.filter((t) => t.projectId === pid).sort((a, b) => a.date.localeCompare(b.date)),
      getProjectAiResults: (pid) => get().aiResults.filter((r) => !r.projectId || r.projectId === pid).slice(0, 20),

      // ─── Export / Import ──────────────────────────────────────────────
      exportData: () => {
        const { projects, factions, npcs, missions, items, documents,
          economyProfiles, timelineEvents, aiResults, relations, currentProjectId, customization } = get();
        return JSON.stringify({
          version: '1.0',
          exportedAt: now(),
          data: { projects, factions, npcs, missions, items, documents,
            economyProfiles, timelineEvents, aiResults, relations, currentProjectId, customization },
        }, null, 2);
      },

      importData: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          const data = parsed.data ?? parsed;
          set({
            projects: data.projects ?? [],
            factions: data.factions ?? [],
            npcs: data.npcs ?? [],
            missions: data.missions ?? [],
            items: data.items ?? [],
            documents: data.documents ?? [],
            economyProfiles: data.economyProfiles ?? [],
            timelineEvents: data.timelineEvents ?? [],
            aiResults: data.aiResults ?? [],
            relations: data.relations ?? [],
            currentProjectId: data.currentProjectId ?? MIRAGE_PROJECT_ID,
            customization: data.customization ?? ALL_DEMO_DATA.customization,
          });
        } catch {
          console.error('Import failed: invalid JSON');
        }
      },

      resetToDemo: () => set({ ...ALL_DEMO_DATA }),
    }),
    {
      name: 'rp-architect-store',
      version: 1,
    }
  )
);
