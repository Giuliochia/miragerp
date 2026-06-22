import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { AIGenerationRequest, AIGenerationResult } from '../../../shared/types';
import { SYSTEM_PROMPT } from '../prompts/systemPrompt';

let client: OpenAI | null = null;

type AIProvider = 'openai' | 'groq';

const GROQ_SYSTEM_PROMPT = `Sei un consulente esperto di server RP FiveM, RedM e DayZ.
Rispondi sempre in italiano con JSON valido.
Scrivi contenuti realmente usabili per server owner, staff, game master e worldbuilder.
Quando l'utente chiede lore, background o storia di un personaggio, scrivi una vera storia in prosa narrativa continua: scene, conflitto, svolta, conseguenze, tono cinematografico. Non spezzare il testo in capitoletti tipo "Introduzione", "Obiettivo", "Conclusioni" salvo richiesta esplicita.
Per ogni generazione includi lore discorsiva, motivazione progettuale, rischi, bilanciamento, collegamenti consigliati, varianti e note esperte.
Per FiveM considera gang, polizia, EMS, lavori legali, illegale, economia, cooldown, farming, powergaming e metagaming.
Per RedM considera bande, sceriffi, taglie, ranch, saloon, carovane, duelli ed economia western.
Per DayZ considera sopravvivenza, scarsita, baratto, fazioni, basi, radio, zone contaminate e rischio farming.
Formato JSON obbligatorio:
{
  "title": "string",
  "strategicSummary": "string",
  "fullNarrative": "string",
  "designReasoning": "string",
  "economyAnalysis": "string|null",
  "expertNotes": "string",
  "coherenceWarnings": [],
  "abuseWarnings": [],
  "suggestedLinks": [],
  "alternatives": []
}`;

function getProvider(): AIProvider {
  return process.env.AI_PROVIDER === 'groq' ? 'groq' : 'openai';
}

export function getAIConfig() {
  const provider = getProvider();
  const apiKey =
    provider === 'groq'
      ? process.env.GROQ_API_KEY
      : process.env.OPENAI_API_KEY;
  const model =
    provider === 'groq'
      ? process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant'
      : process.env.OPENAI_MODEL ?? 'gpt-4o';

  return { provider, apiKey, model };
}

function getClient(): OpenAI {
  if (!client) {
    const { provider, apiKey } = getAIConfig();
    if (!apiKey) {
      const envName = provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY';
      throw new Error(`${envName} non configurata. Aggiungi la chiave nel file .env del server.`);
    }
    client = new OpenAI({
      apiKey,
      baseURL: provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
    });
  }
  return client;
}

const genTypeLabels: Record<string, string> = {
  full_package: 'pacchetto completo (lore, fazioni, NPC, missioni, oggetti, economia, documenti, timeline, rischi)',
  faction: 'fazione/gang/banda completa con gerarchia, territorio, risorse, alleati, nemici, segreti e rischi',
  npc: 'personaggio/NPC completo con psicologia, trauma, obiettivo, paura, segreto e possibile evoluzione',
  mission: 'missione/evento con step, obiettivi, rischi, ricompense, finali alternativi e note anti-abuso',
  narrative_item: 'oggetto narrativo con uso RP, gameplay, economico e regole anti-farm',
  document: 'documento in-game autentico e narrativamente rilevante',
  economy: 'profilo economico completo con analisi bilanciamento legal/illegal',
  legal_illegal_balance: 'analisi comparativa legal vs illegal con balance score e correzioni',
  business: 'business RP completo con servizi, dipendenti, opportunità e link illegali possibili',
  abuse_check: 'analisi anti-abuso completa (farming, powergaming, metagaming, item abuse)',
  timeline: 'timeline narrativa degli eventi chiave del server',
  coherence_check: 'controllo coerenza completo del progetto',
};

const detailInstructions: Record<string, string> = {
  medium: 'Rispondi in modo completo, discorsivo e leggibile. Nel fullNarrative usa prosa narrativa continua, non liste o capitoletti.',
  high: 'Rispondi in modo molto dettagliato, tecnico e narrativo. Nel fullNarrative crea una storia fluida con scene, motivazioni, conflitti e conseguenze.',
  extreme: 'Rispondi in modo esaustivo e cinematografico. Nel fullNarrative scrivi una storia ampia, immersiva e continua, poi lascia l’analisi ai campi tecnici separati.',
};

function getMaxTokens(provider: AIProvider, detailLevel: AIGenerationRequest['detailLevel']): number {
  if (provider === 'groq') {
    if (detailLevel === 'extreme') return 1800;
    if (detailLevel === 'high') return 1400;
    return 900;
  }

  return detailLevel === 'extreme' ? 4096 : detailLevel === 'high' ? 3000 : 2000;
}

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  if (Array.isArray(value)) {
    return value.map((entry) => asText(entry)).filter(Boolean).join('\n\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const text = asText(entry);
        return text ? `${key}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  return String(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function extractJsonObject(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? content;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start >= 0 && end > start) {
    return candidate.slice(start, end + 1);
  }

  return candidate;
}

function cleanRecoveredText(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/^\s*{\s*/, '')
    .replace(/\s*}\s*$/i, '')
    .trim();
}

function matchJsonStringField(content: string, field: string): string | undefined {
  const simple = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 's').exec(content);
  return simple?.[1]?.trim();
}

function matchLooseTextField(content: string, field: string): string | undefined {
  const startPattern = new RegExp(`"${field}"\\s*:\\s*"`, 's');
  const startMatch = startPattern.exec(content);
  if (!startMatch || startMatch.index == null) return undefined;

  const start = startMatch.index + startMatch[0].length;
  const rest = content.slice(start);
  const nextField = rest.search(/",\s*\n\s*"[\w]+":/);
  const raw = nextField >= 0 ? rest.slice(0, nextField) : rest;

  return cleanRecoveredText(raw);
}

function parseLooseGroqJson(content: string): Partial<AIGenerationResult> | null {
  const title = matchJsonStringField(content, 'title');
  const strategicSummary = matchJsonStringField(content, 'strategicSummary');
  const fullNarrative = matchLooseTextField(content, 'fullNarrative');

  if (!title && !strategicSummary && !fullNarrative) {
    return null;
  }

  return {
    title: title ?? 'Lore generata',
    strategicSummary: strategicSummary ?? 'Concept narrativo generato per il progetto attivo.',
    fullNarrative: fullNarrative ?? cleanRecoveredText(content),
    designReasoning:
      matchLooseTextField(content, 'designReasoning') ??
      'La proposta puo essere collegata a fazioni, NPC, missioni, economia e documenti in-game.',
    economyAnalysis: matchLooseTextField(content, 'economyAnalysis') ?? undefined,
    expertNotes: matchLooseTextField(content, 'expertNotes') ?? undefined,
    coherenceWarnings: [],
    abuseWarnings: [],
    suggestedLinks: [],
    alternatives: [],
  };
}

function parseAIResult(content: string, provider: AIProvider): Partial<AIGenerationResult> {
  try {
    return JSON.parse(extractJsonObject(content));
  } catch {
    if (provider === 'groq') {
      const loose = parseLooseGroqJson(content);
      if (loose) return loose;

      return {
        title: 'Lore generata',
        strategicSummary: 'Concept narrativo generato per il progetto attivo. Il contenuto e stato organizzato come base di worldbuilding pronta da rifinire nel Codex.',
        fullNarrative: cleanRecoveredText(content),
        designReasoning: 'La struttura proposta puo essere usata come fondazione narrativa e poi collegata a fazioni, NPC, missioni, economia e documenti in-game.',
        expertNotes: 'Per ottenere sezioni ancora piu ordinate, usa una richiesta specifica come: genera lore, fazioni coinvolte, rischi staff e collegamenti consigliati.',
      };
    }

    throw new Error('OpenAI ha restituito un JSON non valido. Riprova.');
  }
}

async function repairGroqJson(openai: OpenAI, model: string, content: string): Promise<Partial<AIGenerationResult> | null> {
  const trimmed = content.slice(0, 5000);
  try {
    const repair = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'Trasforma il testo utente in JSON valido. Rispondi solo con JSON.',
        },
        {
          role: 'user',
          content: `Crea questo JSON: title, strategicSummary, fullNarrative, designReasoning, economyAnalysis, expertNotes, coherenceWarnings, abuseWarnings, suggestedLinks, alternatives.\n\nTESTO:\n${trimmed}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: 'json_object' },
    });

    const repaired = repair.choices[0]?.message?.content;
    return repaired ? JSON.parse(extractJsonObject(repaired)) : null;
  } catch {
    return null;
  }
}

export async function generateRPContent(req: AIGenerationRequest): Promise<AIGenerationResult> {
  const openai = getClient();
  const { provider, model } = getAIConfig();

  const toggleContext: string[] = [];
  if (req.includeLore) toggleContext.push('lore dettagliata');
  if (req.includeFactions) toggleContext.push('fazioni coinvolte');
  if (req.includeNpc) toggleContext.push('NPC rilevanti');
  if (req.includeMissions) toggleContext.push('missioni collegate');
  if (req.includeItems) toggleContext.push('oggetti narrativi');
  if (req.includeDocuments) toggleContext.push('documenti in-game');
  if (req.includeEconomy) toggleContext.push('analisi economia');
  if (req.includeTimeline) toggleContext.push('eventi timeline');
  if (req.includeCoherenceCheck) toggleContext.push('controllo coerenza');
  if (req.includeAbuseCheck) toggleContext.push('abuse check');

  const userMessage = `
TIPO SERVER: ${req.preset}
TIPO GENERAZIONE: ${genTypeLabels[req.generationType] ?? req.generationType}
LIVELLO DETTAGLIO: ${req.detailLevel} — ${detailInstructions[req.detailLevel]}
TONO NARRATIVO: ${req.tone || 'realistico'}
${req.existingContext ? `CONTESTO PROGETTO: ${req.existingContext.slice(0, 800)}` : ''}
${toggleContext.length > 0 ? `INCLUDI: ${toggleContext.join(', ')}` : ''}

RICHIESTA DELL'UTENTE:
${req.userPrompt}

STILE OBBLIGATORIO:
- Scrivi in italiano naturale, da consulente esperto di server RP.
- Il campo fullNarrative deve essere una vera storia in prosa narrativa continua.
- Non usare titoletti markdown nel fullNarrative come "Introduzione", "Obiettivi", "Conclusione", "Implicazioni".
- Non trasformare la lore in una scheda a pezzi: racconta gli eventi come un racconto, con transizioni e progressione emotiva.
- Usa paragrafi narrativi lunghi e naturali. Le liste vanno solo nei campi tecnici separati, non nella storia.
- Mostra il conflitto del personaggio attraverso azioni, scelte, relazioni e conseguenze.

IMPORTANTE: Rispondi SOLO con JSON valido. Campi principali: title, strategicSummary, fullNarrative, designReasoning, economyAnalysis, expertNotes, coherenceWarnings, abuseWarnings, suggestedLinks, alternatives.`.trim();

  const baseMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: provider === 'groq' ? GROQ_SYSTEM_PROMPT : SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  const completionPayload: ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: baseMessages,
    temperature: 0.8,
    max_tokens: getMaxTokens(provider, req.detailLevel),
  };

  let response: ChatCompletion;
  try {
    response = await openai.chat.completions.create({
      ...completionPayload,
      response_format: { type: 'json_object' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const shouldFallback =
      provider === 'groq' &&
      (message.includes('Failed to generate JSON') || message.includes('failed_generation') || message.includes('400'));

    if (!shouldFallback) {
      throw err;
    }

    response = await openai.chat.completions.create({
      ...completionPayload,
      messages: [
        { role: 'system', content: provider === 'groq' ? GROQ_SYSTEM_PROMPT : SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${userMessage}\n\nSe non riesci a produrre JSON perfetto, scrivi comunque una risposta completa e discorsiva in italiano.`,
        },
      ],
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider === 'groq' ? 'Groq' : 'OpenAI'} ha restituito una risposta vuota.`);
  }

  let parsed = parseAIResult(content, provider);
  if (provider === 'groq' && parsed.title === 'Lore generata') {
    parsed = await repairGroqJson(openai, model, content) ?? parsed;
  }

  return {
    id: '',
    projectId: req.projectId,
    title: asText(parsed.title, 'Output AI'),
    strategicSummary: asText(parsed.strategicSummary),
    fullNarrative: asText(parsed.fullNarrative),
    designReasoning: asText(parsed.designReasoning),
    economyAnalysis: parsed.economyAnalysis ? asText(parsed.economyAnalysis) : undefined,
    expertNotes: parsed.expertNotes ? asText(parsed.expertNotes) : undefined,
    coherenceWarnings: asArray(parsed.coherenceWarnings),
    abuseWarnings: asArray(parsed.abuseWarnings),
    suggestedLinks: asArray(parsed.suggestedLinks),
    alternatives: asArray<unknown>(parsed.alternatives).map((entry) => asText(entry)).filter(Boolean),
    factions: asArray(parsed.factions),
    npcs: asArray(parsed.npcs),
    missions: asArray(parsed.missions),
    items: asArray(parsed.items),
    documents: asArray(parsed.documents),
    timelineEvents: asArray(parsed.timelineEvents),
    createdAt: new Date().toISOString(),
    savedToCodex: false,
  };
}
