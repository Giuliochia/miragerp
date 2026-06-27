export type ServerPreset = 'FiveM' | 'RedM' | 'DayZ' | 'Custom';
export type DangerLevel = 'low' | 'medium' | 'high' | 'critical';
export type LegalStatus = 'legal' | 'gray' | 'illegal';
export type RarityLevel = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type RelationType = 'ally' | 'enemy' | 'rival' | 'neutral' | 'linked' | 'dependent' | 'cover';
export type ApprovalStatus = 'draft' | 'review' | 'approved' | 'released' | 'archived';

// ─── Project ────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  type: ServerPreset;
  setting: string;
  description: string;
  tone: string;
  activePreset: ServerPreset;
  coverColor?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Faction ────────────────────────────────────────────────────────────────

export type FactionType =
  | 'gang' | 'mafia' | 'cartel' | 'family' | 'cover_company'
  | 'rebel' | 'government' | 'police' | 'ems' | 'mechanic'
  | 'outlaw_band' | 'sheriff' | 'tribe' | 'ranch' | 'saloon'
  | 'merchant' | 'bounty_hunter' | 'survival_faction' | 'military'
  | 'medic_group' | 'isolated_community' | 'other';

export interface Faction {
  id: string;
  projectId: string;
  name: string;
  type: FactionType;
  description: string;
  ideology: string;
  territory: string;
  leader: string;
  hierarchy: string[];
  resources: string[];
  allies: string[];
  enemies: string[];
  secret: string;
  dangerLevel: DangerLevel;
  legalStatus: LegalStatus;
  economyRole: string;
  abuseRisk: DangerLevel;
  memberCount: string;
  reputation: number;
  linkedNpcIds: string[];
  linkedMissionIds: string[];
  linkedItemIds: string[];
  linkedDocumentIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── NPC ────────────────────────────────────────────────────────────────────

export interface NPC {
  id: string;
  projectId: string;
  firstName?: string;
  lastName?: string;
  name: string;
  role: string;
  age: number;
  birthDate?: string;
  characterDescription?: string;
  personality: string;
  trauma: string;
  goal: string;
  fear: string;
  secret: string;
  speechStyle: string;
  factionId: string;
  narrativeUse: string;
  practicalFunction: string;
  possibleEvolution: string;
  linkedMissionIds: string[];
  linkedItemIds: string[];
  linkedDocumentIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Mission ─────────────────────────────────────────────────────────────────

export type MissionType =
  | 'rp_mission' | 'staff_event' | 'narrative_quest'
  | 'legal_activity' | 'illegal_activity' | 'citizen_event'
  | 'heist' | 'investigation' | 'delivery'
  | 'territory_war' | 'trial' | 'ems_emergency'
  | 'caravan' | 'bounty' | 'duel'
  | 'expedition' | 'radio_event' | 'contaminated_zone';

export interface Mission {
  id: string;
  projectId: string;
  title: string;
  type: string;
  description: string;
  location: string;
  objective: string;
  difficulty: DangerLevel;
  riskLevel: DangerLevel;
  requiredItems: string[];
  involvedNpcIds: string[];
  involvedFactionIds: string[];
  reward: string;
  cooldown: string;
  status?: ApprovalStatus;
  clues: string[];
  steps: string[];
  alternateEndings: string[];
  antiFarmNotes: string;
  balanceNotes: string;
  abuseRisks: string[];
  linkedDocumentIds: string[];
  linkedItemIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── NarrativeItem ───────────────────────────────────────────────────────────

export type ItemCategory =
  | 'document' | 'weapon' | 'drug' | 'tech' | 'vehicle_part'
  | 'money' | 'key' | 'evidence' | 'medical' | 'survival'
  | 'contraband' | 'luxury' | 'tool' | 'misc';

export interface NarrativeItem {
  id: string;
  projectId: string;
  name: string;
  category: string;
  rarity: string;
  value: number;
  description: string;
  origin: string;
  rpUse: string;
  gameplayUse: string;
  economyUse: string;
  dropDate?: string;
  dropQuantity?: number;
  dropMethod?: string;
  staffNotes?: string;
  status?: ApprovalStatus;
  abuseRisk: DangerLevel;
  antiFarmRules: string;
  factionId?: string;
  missionId?: string;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export type DocumentType =
  | 'letter' | 'contract' | 'police_report' | 'ems_report'
  | 'military_order' | 'diary' | 'manifesto' | 'evidence'
  | 'dirty_note' | 'radio_message' | 'warrant' | 'bounty'
  | 'ledger' | 'other';

export interface Document {
  id: string;
  projectId: string;
  title: string;
  type: string;
  content: string;
  author: string;
  foundLocation: string;
  tone: string;
  status?: ApprovalStatus;
  linkedFactionId?: string;
  linkedNpcId?: string;
  linkedMissionId?: string;
  linkedItemId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Economy ─────────────────────────────────────────────────────────────────

export interface EconomyProfile {
  id: string;
  projectId: string;
  currencyName: string;
  legalIncomeAverage: number;
  illegalIncomeAverage: number;
  commonItemPrice: number;
  rareItemPrice: number;
  weaponPrice: number;
  medicalPrice: number;
  easyMissionReward: number;
  mediumMissionReward: number;
  hardMissionReward: number;
  inflationRisk: DangerLevel;
  balanceScore: number;
  balanceNotes: string;
  antiFarmRules: string[];
  customFolders?: EconomyFolder[];
  customItems?: EconomyCustomItem[];
  createdAt: string;
  updatedAt: string;
}

export interface EconomyFolder {
  id: string;
  parentId?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EconomyCustomItem {
  id: string;
  folderId?: string;
  name: string;
  category: string;
  exportKey?: string;
  prop?: string;
  price: number;
  supplierPrice?: number;
  weight?: number;
  fillWeight?: number;
  satiety?: number;
  fats?: number;
  proteins?: number;
  carbohydrates?: number;
  calories?: number;
  impactBand?: 'low' | 'medium' | 'high';
  quantity: number;
  acquisition: string;
  stackNum?: number;
  itemWL?: string;
  statusName?: string;
  statusValue?: number;
  animDict?: string;
  animClip?: string;
  restockPerDay: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppCustomization {
  economyItemCategories: string[];
  economyAcquisitionMethods: string[];
  healthyScoreThreshold: number;
  warningScoreThreshold: number;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | 'faction_founding' | 'server_event' | 'war' | 'heist'
  | 'trial' | 'narrative_death' | 'leadership_change'
  | 'economic_crisis' | 'staff_event' | 'alliance' | 'betrayal';

export interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  type: TimelineEventType;
  date: string;
  description: string;
  linkedFactionIds: string[];
  linkedNpcIds: string[];
  linkedMissionIds: string[];
  linkedItemIds: string[];
  linkedDocumentIds: string[];
  impact: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Jobs & Business ─────────────────────────────────────────────────────────

export interface RPJob {
  id: string;
  projectId: string;
  name: string;
  type: 'legal' | 'illegal' | 'gray';
  description: string;
  incomePerHour: number;
  riskLevel: DangerLevel;
  requiredEquipment: string[];
  factionLink?: string;
  cooldown: string;
  farmRisk: DangerLevel;
}

export interface LegalBusiness {
  id: string;
  projectId: string;
  name: string;
  owner: string;
  employees: string[];
  services: string[];
  prices: Record<string, number>;
  rpOpportunities: string[];
  illegalLinks: string[];
  abuseRisk: DangerLevel;
  linkedMissionIds: string[];
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export interface LegalIllegalBalance {
  id: string;
  projectId: string;
  legalJobName: string;
  legalIncome: number;
  illegalActivityName: string;
  illegalIncome: number;
  policeRisk: DangerLevel;
  jailRisk: number;
  itemLossRisk: number;
  cooldown: string;
  initialInvestment: number;
  rpAppeal: number;
  economyImpact: string;
  balanceScore: number;
  analysis: string;
  problems: string[];
  corrections: string[];
}

// ─── AI Generation ───────────────────────────────────────────────────────────

export type GenerationType =
  | 'full_package' | 'faction' | 'npc' | 'mission'
  | 'narrative_item' | 'document' | 'economy' | 'legal_illegal_balance'
  | 'business' | 'abuse_check' | 'timeline' | 'coherence_check';

export type DetailLevel = 'medium' | 'high' | 'extreme';

export interface AIGenerationRequest {
  projectId: string;
  preset: ServerPreset;
  generationType: GenerationType;
  userPrompt: string;
  detailLevel: DetailLevel;
  tone: string;
  includeLore: boolean;
  includeFactions: boolean;
  includeNpc: boolean;
  includeMissions: boolean;
  includeItems: boolean;
  includeDocuments: boolean;
  includeEconomy: boolean;
  includeTimeline: boolean;
  includeCoherenceCheck: boolean;
  includeAbuseCheck: boolean;
  existingContext?: string;
}

export interface AIGenerationResult {
  id: string;
  projectId?: string;
  requestId?: string;
  title: string;
  strategicSummary: string;
  fullNarrative: string;
  designReasoning: string;
  factions?: Partial<Faction>[];
  npcs?: Partial<NPC>[];
  missions?: Partial<Mission>[];
  items?: Partial<NarrativeItem>[];
  documents?: Partial<Document>[];
  economyAnalysis?: string;
  timelineEvents?: Partial<TimelineEvent>[];
  coherenceWarnings?: CoherenceWarning[];
  abuseWarnings?: AbuseWarning[];
  suggestedLinks?: SuggestedLink[];
  alternatives?: string[];
  expertNotes?: string;
  createdAt: string;
  savedToCodex: boolean;
}

// ─── Warnings ─────────────────────────────────────────────────────────────────

export interface CoherenceWarning {
  id: string;
  riskLevel: DangerLevel;
  title: string;
  explanation: string;
  correction: string;
  affectedElements: string[];
}

export interface AbuseWarning {
  id: string;
  type: 'farming' | 'powergaming' | 'metagaming' | 'item_abuse' | 'economy_abuse' | 'other';
  riskLevel: DangerLevel;
  title: string;
  explanation: string;
  correction: string;
  affectedElements: string[];
}

// ─── Relations ────────────────────────────────────────────────────────────────

export interface Relation {
  id: string;
  projectId: string;
  fromId: string;
  fromType: 'faction' | 'npc' | 'mission' | 'item' | 'document';
  fromName: string;
  toId: string;
  toType: 'faction' | 'npc' | 'mission' | 'item' | 'document';
  toName: string;
  relationType: RelationType;
  description?: string;
}

export interface SuggestedLink {
  fromName: string;
  toName: string;
  reason: string;
  type: RelationType;
}

// ─── Law Enforcement / Medical ────────────────────────────────────────────────

export interface LawEnforcementProfile {
  id: string;
  projectId: string;
  factionId: string;
  staffCount: number;
  jurisdiction: string;
  corruptionLevel: DangerLevel;
  investigationCapacity: DangerLevel;
  responseTime: string;
  tools: string[];
  weaknesses: string[];
}

export interface MedicalRPProfile {
  id: string;
  projectId: string;
  factionId: string;
  staffCount: number;
  revivePolicy: string;
  treatmentCost: number;
  abusePrevention: string;
  linkedHospital: string;
}

// ─── App State Types ──────────────────────────────────────────────────────────

export interface AppState {
  currentProjectId: string | null;
  customization: AppCustomization;
  projects: Project[];
  factions: Faction[];
  npcs: NPC[];
  missions: Mission[];
  items: NarrativeItem[];
  documents: Document[];
  economyProfiles: EconomyProfile[];
  timelineEvents: TimelineEvent[];
  aiResults: AIGenerationResult[];
  relations: Relation[];
}
