import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { LinksToolSchema } from './schema';

/*
      AI MODEL
inkeep-qa-sonnet-3-5 (recommended) 

inkeep-qa-gpt-4o 

inkeep-qa-gpt-4-turbo 

inkeep-contextual-gpt-4-turbo (recommended) 

inkeep-contextual-gpt-4o

*/

const openai = createOpenAI({
  baseURL: 'https://api.inkeep.com/v1/',
  apiKey: 'aad40320d00e7c09ea18df89a31028bf6068d6c8fd8c6c09' || 'YOUR_API_KEY',
});

const provideLinks = async ({ links, text }: { links?: (typeof LinksToolSchema._type)['links']; text: string }) => {
  console.log('Streamed text: ', text);
  console.log('\nLinks used in response: ', links);

  // must return promise
  return Promise.resolve();
};

const getResponseFromAI = async () => {
  const result = await streamText({
    model: openai('inkeep-contextual-gpt-4-turbo'),
    tools: {
      provideLinks: tool({
        parameters: LinksToolSchema,
        description: 'Provides links',
        execute: provideLinks,
      }),
    },
    toolChoice: { toolName: 'provideLinks', type: 'tool' },
    prompt: 'What is Inkeep?',
  });

  console.log('result', result);
};

getResponseFromAI();
