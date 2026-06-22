import { Router, Request, Response } from 'express';
import { generateRPContent, getAIConfig } from '../services/openaiService';
import type { AIGenerationRequest } from '../../../shared/types';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<AIGenerationRequest>;

  // Validation
  if (!body.userPrompt || typeof body.userPrompt !== 'string' || body.userPrompt.trim().length < 3) {
    res.status(400).json({ error: 'Il campo userPrompt è obbligatorio e deve contenere almeno 3 caratteri.' });
    return;
  }

  const aiConfig = getAIConfig();
  if (!aiConfig.apiKey) {
    const envName = aiConfig.provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY';
    res.status(503).json({
      error: `${envName} non configurata. Aggiungi la chiave nel file server/.env e riavvia il server.`,
    });
    return;
  }

  const request: AIGenerationRequest = {
    projectId: body.projectId ?? '',
    preset: body.preset ?? 'FiveM',
    generationType: body.generationType ?? 'full_package',
    userPrompt: body.userPrompt.trim(),
    detailLevel: body.detailLevel ?? 'high',
    tone: body.tone ?? 'realistico',
    includeLore: body.includeLore ?? true,
    includeFactions: body.includeFactions ?? true,
    includeNpc: body.includeNpc ?? true,
    includeMissions: body.includeMissions ?? false,
    includeItems: body.includeItems ?? false,
    includeDocuments: body.includeDocuments ?? false,
    includeEconomy: body.includeEconomy ?? false,
    includeTimeline: body.includeTimeline ?? false,
    includeCoherenceCheck: body.includeCoherenceCheck ?? true,
    includeAbuseCheck: body.includeAbuseCheck ?? true,
    existingContext: body.existingContext,
  };

  try {
    const result = await generateRPContent(request);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore interno del server.';
    console.error('[/api/generate]', message);

    if (message.includes('OPENAI_API_KEY') || message.includes('GROQ_API_KEY')) {
      res.status(503).json({ error: message });
    } else if (message.toLowerCase().includes('invalid api key') || message.includes('invalid_api_key') || message.includes('401')) {
      res.status(401).json({ error: 'Chiave API non valida. Verifica il file server/.env.' });
    } else if (message.toLowerCase().includes('quota') || message.includes('insufficient_quota')) {
      res.status(402).json({
        error: 'Quota AI esaurita o billing non attivo. Controlla credito, piano e limite di spesa del provider configurato.',
      });
    } else if (message.includes('rate limit') || message.includes('429')) {
      res.status(429).json({ error: 'Rate limit del provider AI raggiunto. Attendi qualche secondo e riprova.' });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

export default router;
