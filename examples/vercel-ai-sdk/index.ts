import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { LinksToolSchema } from './inkeepQAToolsSchema';
import type { z } from 'zod';

if (!process.env.INKEEP_API_KEY) {
  throw new Error('INKEEP_API_KEY is required');
}

const openai = createOpenAI({
  baseURL: 'https://api.inkeep.com/v1/',
  apiKey: process.env.INKEEP_API_KEY,
});

const provideLinks = async ({ links }: z.infer<typeof LinksToolSchema>) => {
  console.log('\nLinks used in response: ', links);

  // must return promise
  return Promise.resolve();
};

const getResponseFromAI = async () => {
  const result = await streamText({
    model: openai('inkeep-qa-expert'),
    tools: {
      provideLinks: tool({
        parameters: LinksToolSchema,
        description: 'Provides links',
        execute: provideLinks,
      }),
    },
    prompt: 'How do I get started?',
  });

  console.log('result', result.toTextStreamResponse());
};

getResponseFromAI();
