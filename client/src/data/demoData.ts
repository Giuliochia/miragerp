import type {
  Project, Faction, NPC, Mission, NarrativeItem, Document,
  EconomyProfile, TimelineEvent, AIGenerationResult
} from '../../../shared/types';

// ─── Projects ────────────────────────────────────────────────────────────────

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'project-omnia',
    name: 'OMNIA RP',
    type: 'FiveM',
    setting: 'Città moderna con criminalità urbana, EMS, polizia, aziende legali, gang e attività clandestine.',
    description:
      'Un server FiveM di fascia alta ambientato in una metropoli corrotta dove la linea tra legale e illegale è sempre più sottile. Gang, corporazioni, investigatori e politici corrotti coesistono in un ecosistema narrativo ricco.',
    tone: 'Realistico, maturo, urbano, cinematografico',
    activePreset: 'FiveM',
    coverColor: '#D6A13A',
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-11-15T18:30:00Z',
  },
  {
    id: 'project-frontier',
    name: 'Frontier Bloodline',
    type: 'RedM',
    setting: 'Frontiera americana, bande di fuorilegge, sceriffi, ranch, saloon e commercio di frontiera.',
    description:
      'Un server RedM ambientato nella frontiera americana dove la legge è un concetto relativo. Bande di fuorilegge, cacciatori di taglie, tribù native e commercianti si contendono il controllo di territori selvaggi.',
    tone: 'Sporco, realistico, drammatico',
    activePreset: 'RedM',
    coverColor: '#F59E0B',
    createdAt: '2024-10-15T09:00:00Z',
    updatedAt: '2024-11-10T14:00:00Z',
  },
  {
    id: 'project-wilddeath',
    name: 'WILD DEATH',
    type: 'DayZ',
    setting: 'Post-apocalittica, survival, baratto, fazioni e zone pericolose contaminate.',
    description:
      'Un server DayZ post-apocalittico dove la sopravvivenza è tutto. Fazioni in guerra per risorse scarse, zone contaminate, baratto e diplomazia di frontiera definiscono il mondo di WILD DEATH.',
    tone: 'Cupo, survival, realistico',
    activePreset: 'DayZ',
    coverColor: '#22C55E',
    createdAt: '2024-11-01T12:00:00Z',
    updatedAt: '2024-11-12T16:00:00Z',
  },
];

// ─── Factions ─────────────────────────────────────────────────────────────────

export const DEMO_FACTIONS: Faction[] = [
  {
    id: 'faction-vagos',
    projectId: 'project-omnia',
    name: 'Los Santos Vagos',
    type: 'gang',
    description:
      'Storica gang di strada che controlla il distretto sud di Los Santos. I Vagos hanno radici profonde nella comunità latina e gestiscono un complesso network di attività illegali mascherato da imprese locali.',
    ideology: 'Lealtà al territorio, solidarietà etnica, dominio economico attraverso il controllo delle strade.',
    territory: 'South Los Santos, Davis, Strawberry Avenue',
    leader: 'Rico Mendez',
    hierarchy: ['El Jefe (Rico Mendez)', 'Los Segundos (2 capitani)', 'Soldados (15-30)', 'Prospects (10-20)'],
    resources: ['Rete di distribuzione droga', 'Officina di copertura', 'Connessioni con cartello messicano'],
    allies: ['OMNIA Corp (accordo segreto)', 'Alcuni agenti corrotti LSPD'],
    enemies: ['Ballas', 'The Lost MC', 'LSPD Task Force'],
    secret: 'Rico Mendez è un informatore del FBI che usa la gang come copertura per un\'operazione sotto copertura più grande.',
    dangerLevel: 'high',
    legalStatus: 'illegal',
    economyRole: 'Distribuzione droga, rapine organizzate, protezione commercianti',
    abuseRisk: 'high',
    memberCount: '24-60',
    reputation: 85,
    linkedNpcIds: ['npc-rico'],
    linkedMissionIds: ['mission-consegna'],
    linkedItemIds: ['item-burner-phone', 'item-ledger'],
    linkedDocumentIds: ['doc-registro'],
    createdAt: '2024-09-05T10:00:00Z',
    updatedAt: '2024-11-10T15:00:00Z',
  },
  {
    id: 'faction-omnia-corp',
    projectId: 'project-omnia',
    name: 'OMNIA Corp',
    type: 'cover_company',
    description:
      'Corporazione multimiliardaria con sede nel centro finanziario di Los Santos. In apparenza gestisce real estate, logistica e consulenza finanziaria. In realtà è il principale riciclatore di denaro sporco della città.',
    ideology: 'Profitto sopra tutto. Il potere si ottiene attraverso il denaro, il denaro attraverso il controllo.',
    territory: 'Rockford Hills, Vinewood, Porto Commerciale',
    leader: 'Victoria Crane (CEO)',
    hierarchy: ['CEO', 'CFO', 'Head of Security (ex militare)', 'Regional Managers', 'Dipendenti legali (copertura)'],
    resources: ['Liquidità illimitata', 'Avvocati di alto profilo', 'Connessioni politiche', 'Sicurezza privata armata'],
    allies: ['Los Santos Vagos (accordo segreto)', 'Politici corrotti', 'Giudici comprati'],
    enemies: ['FBI', 'Investigatori privati', 'Giornalisti investigativi'],
    secret: 'Victoria Crane sta pianificando di "eliminare" i Vagos una volta completato il riciclaggio del debito accumulato.',
    dangerLevel: 'critical',
    legalStatus: 'gray',
    economyRole: 'Riciclaggio denaro, controllo immobiliare, corruzione sistematica',
    abuseRisk: 'medium',
    memberCount: '8-15 (nucleo criminale)',
    reputation: 95,
    linkedNpcIds: [],
    linkedMissionIds: [],
    linkedItemIds: ['item-ledger'],
    linkedDocumentIds: ['doc-registro'],
    createdAt: '2024-09-10T10:00:00Z',
    updatedAt: '2024-11-12T11:00:00Z',
  },
];

// ─── NPCs ─────────────────────────────────────────────────────────────────────

export const DEMO_NPCS: NPC[] = [
  {
    id: 'npc-rico',
    projectId: 'project-omnia',
    name: 'Rico Mendez',
    role: 'Capo dei Los Santos Vagos / Informatore FBI segreto',
    age: 38,
    personality:
      'Carismatico, parla poco e con autorità. Umorismo nero. Sempre calmo anche sotto pressione. Leale con chi si guadagna la sua fiducia.',
    trauma:
      'Ha perso suo fratello minore in una guerra di gang a 17 anni. Da allora vive con la colpa di non averlo protetto.',
    goal: 'Usare i Vagos per smantellare il cartello che ha ucciso suo fratello, poi uscire pulito con l\'immunità FBI.',
    fear: 'Che i suoi uomini scoprano che è un informatore prima che lui possa metterli in salvo.',
    secret: 'Collabora con l\'agente FBI Reyes da 4 anni. Ha già incastrato 3 boss di cartello.',
    speechStyle: 'Parla in italiano mescolato a spagnolo. Frasi brevi. Non spiega mai, lascia intendere.',
    factionId: 'faction-vagos',
    narrativeUse:
      'Personaggio pivot tra crimine organizzato e law enforcement. Può essere mentore, antagonista o alleato complesso.',
    practicalFunction:
      'Quest giver per missioni illegali. Punto di accesso ai Vagos. Contatto per informazioni sul cartello.',
    possibleEvolution:
      'Se scoperto: diventare un fuggiasco braccato da entrambi i lati. Se protetto: facilitare la fine dei Vagos con immunità per i minori.',
    linkedMissionIds: ['mission-consegna'],
    linkedItemIds: ['item-burner-phone'],
    linkedDocumentIds: [],
    createdAt: '2024-09-06T10:00:00Z',
    updatedAt: '2024-11-08T14:00:00Z',
  },
];

// ─── Missions ────────────────────────────────────────────────────────────────

export const DEMO_MISSIONS: Mission[] = [
  {
    id: 'mission-consegna',
    projectId: 'project-omnia',
    title: 'Consegna Speciale',
    type: 'illegal_activity',
    description:
      'Rico Mendez necessita di un corriere fidato per recapitare un pacco sigillato a un contatto nel porto commerciale. Il contenuto non deve essere aperto. Nessuna domanda.',
    location: 'South LS → Porto Commerciale Terminal B',
    objective:
      'Ricevere il pacco da un membro dei Vagos, attraversare la città evitando checkpoint, consegnare al contatto "El Marinero" nel porto senza essere seguiti.',
    difficulty: 'medium',
    riskLevel: 'high',
    requiredItems: ['item-burner-phone'],
    involvedNpcIds: ['npc-rico'],
    involvedFactionIds: ['faction-vagos'],
    reward: '$8,500 + Reputazione +5 con Vagos',
    cooldown: '72 ore (per corriere)',
    clues: [
      'Il pacco emette un segnale radio se aperto (tracker interno)',
      'El Marinero ha un tatuaggio di ancora sul collo',
      'Due agenti in borghese monitorano il porto quel giorno',
    ],
    steps: [
      'Contattare Rico al numero sul Burner Phone',
      'Incontrare il membro Vagos all\'officina in Strawberry',
      'Attraversare la città usando strade secondarie',
      'Verificare la zona porto con ricognizione (15 min)',
      'Consegnare il pacco e ricevere la busta con il pagamento',
    ],
    alternateEndings: [
      'SUCCESSO PIENO: Consegna pulita → +rep Vagos, accesso a missioni di livello superiore',
      'INTERCETTATO: Arresto con possibile gestione in-server del processo',
      'PACCO APERTO: Rico Mendez diventa nemico → possibile contratto sulla testa del giocatore',
      'DOPPIO GIOCO: Vendere informazioni all\'FBI → accesso alla storyline FBI segreta',
    ],
    antiFarmNotes: 'Cooldown 72h per personaggio. Max 1 missione per corriere attiva. Ricompensa scalata in base a rischi incontrati.',
    balanceNotes: '$8,500 vs lavoro legale ~$2,000/h. Rischio arresto/morte/contratto giustifica il delta.',
    abuseRisks: [
      'Corrieri multipli dello stesso giocatore (alt abuse)',
      'Meta-gaming sulla posizione degli agenti in borghese',
      'Log out per evitare l\'arresto',
    ],
    linkedDocumentIds: ['doc-registro'],
    linkedItemIds: ['item-burner-phone'],
    createdAt: '2024-09-10T10:00:00Z',
    updatedAt: '2024-11-05T16:00:00Z',
  },
];

// ─── Items ────────────────────────────────────────────────────────────────────

export const DEMO_ITEMS: NarrativeItem[] = [
  {
    id: 'item-burner-phone',
    projectId: 'project-omnia',
    name: 'Telefono Burner',
    category: 'tech',
    rarity: 'uncommon',
    value: 800,
    description: 'Cellulare prepagato usa-e-getta. Numero irrintracciabile. Contiene un solo contatto salvato.',
    origin: 'Distribuito dai Vagos ai corrieri fidati. Acquistabile al mercato nero per $800.',
    rpUse: 'Comunicazione sicura con contatti criminali. Può contenere messaggi, coordinate, codici.',
    gameplayUse: 'Attiva specifiche missioni e dialoghi. Tracciabile se mantenuto acceso troppo a lungo.',
    economyUse: 'Oggetto necessario per missioni illegali di alto livello. Non riverdibile.',
    abuseRisk: 'medium',
    antiFarmRules: 'Max 1 per personaggio attivo. Confiscato in caso di arresto. Non trasferibile.',
    factionId: 'faction-vagos',
    missionId: 'mission-consegna',
    documentIds: [],
    createdAt: '2024-09-08T10:00:00Z',
    updatedAt: '2024-10-20T12:00:00Z',
  },
  {
    id: 'item-ledger',
    projectId: 'project-omnia',
    name: 'Registro Contabile Sporco',
    category: 'document',
    rarity: 'rare',
    value: 15000,
    description: 'Libro mastro crittografato con movimenti di denaro sporco. Cifre, codici e nomi in codice.',
    origin: 'Apparteneva a un contabile di OMNIA Corp eliminato. La sua posizione era nota solo a Rico Mendez.',
    rpUse: 'Prova investigativa fondamentale. Può incastrare OMNIA Corp o i Vagos. Oggetto di scambio in trattative.',
    gameplayUse: 'Sblocca la storyline "Guerra Silenziosa". Richiesto per aprire il processo in-server contro OMNIA Corp.',
    economyUse: 'Non vendibile. Valore esclusivamente narrativo/progressione storyline.',
    abuseRisk: 'low',
    antiFarmRules: 'Oggetto unico. Non duplicabile. Deve essere fisicamente in possesso del personaggio.',
    factionId: 'faction-omnia-corp',
    missionId: undefined,
    documentIds: ['doc-registro'],
    createdAt: '2024-09-15T10:00:00Z',
    updatedAt: '2024-11-01T09:00:00Z',
  },
];

// ─── Documents ────────────────────────────────────────────────────────────────

export const DEMO_DOCUMENTS: Document[] = [
  {
    id: 'doc-registro',
    projectId: 'project-omnia',
    title: 'Registro Contabile Sporco — Estratto Codificato',
    type: 'ledger',
    content: `ESTRATTO — REGISTRO INTERNO OMNIA CORP / SERIE K-7

DATA: [REDACTED]
OPERATORE: "Il Contabile"
CODICE OPERAZIONE: LAUNDRY-DELTA-09

MOVIMENTI:
  > Entrata: $2.400.000 — Provenienza: "Consegne Speciali" (VAGOS — Codice VG-11)
  > Uscita: $2.350.000 — Destinazione: "Conti Offshore Shell A-7 e B-3"
  > Commissione trattenuta: $50.000 (2%)
  > Data valuta: 72h dalla consegna

NOTE OPERATIVE:
  — Il Jefe conosce solo il codice VG-11, non i conti finali.
  — Victoria Crane ha autorizzato personalmente questa tranche.
  — In caso di compromissione: attivare Protocollo K (eliminazione contabile + documenti).

STATO: CHIUSO
ARCHIVIATO: Cassetta n.7, Ufficio Victoria Crane, Piano 34`,
    author: 'Il Contabile (identità sconosciuta)',
    foundLocation: 'Nascosto nella suola di una scarpa consegnata al porto, Terminal B',
    tone: 'Freddo, burocratico, con sottotesto di violenza implicita',
    linkedFactionId: 'faction-omnia-corp',
    linkedNpcId: 'npc-rico',
    linkedMissionId: 'mission-consegna',
    linkedItemId: 'item-ledger',
    createdAt: '2024-09-20T10:00:00Z',
    updatedAt: '2024-10-15T11:00:00Z',
  },
];

// ─── Economy ─────────────────────────────────────────────────────────────────

export const DEMO_ECONOMY: EconomyProfile[] = [
  {
    id: 'economy-omnia',
    projectId: 'project-omnia',
    currencyName: 'Dollaro LS ($)',
    legalIncomeAverage: 2200,
    illegalIncomeAverage: 9800,
    commonItemPrice: 350,
    rareItemPrice: 8500,
    weaponPrice: 4500,
    medicalPrice: 650,
    easyMissionReward: 1500,
    mediumMissionReward: 4500,
    hardMissionReward: 12000,
    inflationRisk: 'medium',
    balanceScore: 58,
    balanceNotes:
      'Il gap legale/illegale è attualmente 4.5x. Il rischio effettivo (arresto, perdita item, morte narrativa) deve aumentare per giustificare il delta. Consiglio: aumento del 30% sulla probabilità di intercettazione, riduzione del payout medio illegale a $7.000.',
    antiFarmRules: [
      'Cooldown 72h per missioni illegali ripetute',
      'Max 3 missioni illegali per settimana per personaggio',
      'Ogni missione illegale richiede setup RP documentato in chat',
      'Staff audit mensile su tutti i personaggi con >$500k in banca',
    ],
    customFolders: [
      {
        id: 'eco-folder-illegale',
        name: 'Illegale',
        createdAt: '2024-09-25T10:00:00Z',
        updatedAt: '2024-09-25T10:00:00Z',
      },
      {
        id: 'eco-folder-medico',
        name: 'Medico',
        createdAt: '2024-09-25T10:00:00Z',
        updatedAt: '2024-09-25T10:00:00Z',
      },
    ],
    customItems: [
      {
        id: 'eco-burner-phone',
        folderId: 'eco-folder-illegale',
        name: 'Telefono Burner',
        category: 'illegal',
        price: 800,
        quantity: 18,
        acquisition: 'black_market',
        restockPerDay: 4,
        notes: 'Necessario per missioni criminali, confiscabile dalla polizia.',
      },
      {
        id: 'eco-medkit',
        folderId: 'eco-folder-medico',
        name: 'Kit Trauma EMS',
        category: 'medical',
        price: 650,
        quantity: 40,
        acquisition: 'shop',
        restockPerDay: 12,
        notes: 'Prezzo accessibile ma da legare a uso EMS per evitare spam revive.',
      },
      {
        id: 'eco-pistol',
        folderId: 'eco-folder-illegale',
        name: 'Pistola Modificata',
        category: 'weapon',
        price: 4500,
        quantity: 8,
        acquisition: 'black_market',
        restockPerDay: 1,
        notes: 'Quantita limitata: bene per contenere escalation armata.',
      },
    ],
    createdAt: '2024-09-25T10:00:00Z',
    updatedAt: '2024-11-10T14:00:00Z',
  },
];

// ─── Timeline ────────────────────────────────────────────────────────────────

export const DEMO_TIMELINE: TimelineEvent[] = [
  {
    id: 'timeline-vagos-founding',
    projectId: 'project-omnia',
    title: 'Fondazione dei Los Santos Vagos',
    type: 'faction_founding',
    date: '2019-03-15',
    description:
      'Rico Mendez e suo cugino Hector fondano i Vagos dalle ceneri di una vecchia gang disciolta. Partono con 8 uomini e un vicolo a Strawberry.',
    linkedFactionIds: ['faction-vagos'],
    linkedNpcIds: ['npc-rico'],
    linkedMissionIds: [],
    linkedItemIds: [],
    linkedDocumentIds: [],
    impact: 'Getta le basi del controllo territoriale sud. Punto d\'inizio per tutta la storyline Vagos.',
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-09-01T10:00:00Z',
  },
  {
    id: 'timeline-omnia-deal',
    projectId: 'project-omnia',
    title: 'Accordo Segreto: Vagos x OMNIA Corp',
    type: 'alliance',
    date: '2022-08-01',
    description:
      'Victoria Crane propone a Rico Mendez un accordo di riciclaggio. I Vagos consegnano contanti sporchi, OMNIA li ripulisce attraverso shell companies. Rico accetta senza rivelare l\'accordo ai suoi.',
    linkedFactionIds: ['faction-vagos', 'faction-omnia-corp'],
    linkedNpcIds: ['npc-rico'],
    linkedMissionIds: [],
    linkedItemIds: ['item-ledger'],
    linkedDocumentIds: ['doc-registro'],
    impact: 'Inizia il ciclo di riciclaggio che porta alla creazione del Registro Contabile Sporco.',
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-09-01T10:00:00Z',
  },
];

// ─── AI Demo Results ──────────────────────────────────────────────────────────

export const DEMO_AI_RESULTS: AIGenerationResult[] = [
  {
    id: 'ai-result-demo-1',
    projectId: 'project-omnia',
    title: 'Los Santos Vagos — Profilo Completo Gang FiveM',
    strategicSummary:
      'I Vagos sono una gang di medio-alto livello con un doppio binario narrativo: criminalità organizzata in superficie, operazione FBI sotto. Questo li rende perfetti per storyline multi-strato.',
    fullNarrative:
      'Gang fondata da Rico Mendez nel 2019 con radici nella comunità latina di South LS. Controllo territoriale su 3 distretti. Network di distribuzione droga, protezione e rapine coordinate...',
    designReasoning:
      'Il segreto dell\'informatore di Rico crea tensione narrativa sostenibile senza richiedere intervento staff continuo. I giocatori possono scoprirlo organicamente.',
    expertNotes: 'Attenzione al rischio di metagaming sulla storyline FBI. Consiglio di gestire l\'informazione come lore riservata agli staff.',
    coherenceWarnings: [],
    abuseWarnings: [
      {
        id: 'aw-1',
        type: 'farming',
        riskLevel: 'medium',
        title: 'Missioni Vagos Farmabili',
        explanation: 'Le consegne ripetute con lo stesso corriere possono diventare un loop di farming.',
        correction: 'Implementare cooldown 72h e variare i percorsi richiesti.',
        affectedElements: ['mission-consegna'],
      },
    ],
    suggestedLinks: [
      { fromName: 'Los Santos Vagos', toName: 'OMNIA Corp', reason: 'Accordo di riciclaggio già in essere', type: 'linked' },
    ],
    alternatives: [
      'Versione alternativa: Rico Mendez NON è un informatore ma lo diventa dopo una storyline di tradimento.',
    ],
    createdAt: '2024-11-10T15:00:00Z',
    savedToCodex: true,
  },
];

// ─── Export All ───────────────────────────────────────────────────────────────

export const ALL_DEMO_DATA = {
  customization: {
    economyItemCategories: ['Comune', 'Raro', 'Arma', 'Medico', 'Illegale', 'Business', 'Lusso', 'Utilità'],
    economyAcquisitionMethods: ['Negozio', 'Crafting', 'Missione RP', 'Mercato nero', 'Solo staff', 'Loot'],
    healthyScoreThreshold: 75,
    warningScoreThreshold: 50,
  },
  projects: DEMO_PROJECTS,
  factions: DEMO_FACTIONS,
  npcs: DEMO_NPCS,
  missions: DEMO_MISSIONS,
  items: DEMO_ITEMS,
  documents: DEMO_DOCUMENTS,
  economyProfiles: DEMO_ECONOMY,
  timelineEvents: DEMO_TIMELINE,
  aiResults: DEMO_AI_RESULTS,
  relations: [],
  currentProjectId: 'project-omnia',
};
