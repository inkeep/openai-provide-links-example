import OpenAI from 'openai';
import { LinksToolSchema } from './schema';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

if (!process.env.INKEEP_API_KEY) {
  throw new Error('INKEEP_API_KEY is required');
}

const client = new OpenAI({
  baseURL: 'https://api.inkeep.com/v1/',
  apiKey: process.env.INKEEP_API_KEY,
});

async function getResponseFromAI() {
  const result = await client.chat.completions.create({
    model: 'inkeep-contextual-gpt-4-turbo', // ai model
    messages: [{ role: 'user', content: 'Why Inkeep?' }, { role: 'assistant', content: 'Inkeep is a tool for building knowledge bases.' }],
    tools: [
      {
        type: 'function',
        function: {
          name: 'provideLinks',
          description: 'Provides links',
          parameters: zodToJsonSchema(LinksToolSchema.extend({
            text: z.string(),
          })),
        },
      },
    ],
  });

  // Check if the function is called in the response
  const toolCalls = result.choices[0]?.message?.tool_calls;
  if (toolCalls && toolCalls.length > 0) {
    const provideLinksCall = toolCalls.find(call => call.function.name === 'provideLinks');
    if (provideLinksCall) {
      const functionArgs = JSON.parse(provideLinksCall.function.arguments);
      await provideLinks(functionArgs);
    } else {
      console.log('No provideLinks tool call found');
    }
  } else {
    console.log('result', result);
  }
}

const provideLinks = async ({ links, text }: { links?: (typeof LinksToolSchema._type)['links']; text: string }) => {
  console.log('Streamed text: ', text);
  console.log('\nLinks used in response: ', links);

  // must return promise
  return Promise.resolve();
};

getResponseFromAI();
