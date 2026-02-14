'use server';
/**
 * @fileOverview Fluxo de IA para auxiliar a equipe de mídia com ideias criativas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MediaAssistantInputSchema = z.object({
  prompt: z.string().describe('A pergunta ou solicitação do usuário.'),
  context: z.enum(['visual', 'social', 'devotional', 'general']).default('general').describe('O contexto da ajuda solicitada.'),
});
export type MediaAssistantInput = z.infer<typeof MediaAssistantInputSchema>;

const MediaAssistantOutputSchema = z.object({
  suggestion: z.string().describe('A sugestão gerada pela IA.'),
});
export type MediaAssistantOutput = z.infer<typeof MediaAssistantOutputSchema>;

export async function mediaAssistant(input: MediaAssistantInput): Promise<MediaAssistantOutput> {
  return mediaAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mediaAssistantPrompt',
  input: { schema: MediaAssistantInputSchema },
  output: { schema: MediaAssistantOutputSchema },
  prompt: `Você é o Assistente Criativo do grupo "Atos Multimídia". Seu tom deve ser inspirador, prestativo e espiritual.

Instruções:
- Se o contexto for 'visual', sugira paletas de cores (HEX), estilos de fontes e tipos de backgrounds para a projeção do culto.
- Se o contexto for 'social', crie 2 opções de legendas criativas para o Instagram, incluindo hashtags.
- Se o contexto for 'devotional', escreva uma mensagem curta de encorajamento para o grupo de WhatsApp dos voluntários, citando um versículo bíblico relevante.
- Se for 'general', responda de forma consultiva sobre tecnologia e mídia na igreja.

Usuário solicitou: {{{prompt}}}`,
});

const mediaAssistantFlow = ai.defineFlow(
  {
    name: 'mediaAssistantFlow',
    inputSchema: MediaAssistantInputSchema,
    outputSchema: MediaAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Falha ao gerar sugestão');
    return output;
  }
);
