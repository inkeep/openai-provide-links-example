import OpenAI from 'openai';
import type { LinksToolSchema } from './schema';

/*
      AI MODEL
inkeep-qa-sonnet-3-5 (recommended) 

inkeep-qa-gpt-4o 

inkeep-qa-gpt-4-turbo 

inkeep-contextual-gpt-4-turbo (recommended) 

inkeep-contextual-gpt-4o

*/

const client = new OpenAI({
  baseURL: 'https://api.inkeep.com/v1/',
  apiKey: 'aad40320d00e7c09ea18df89a31028bf6068d6c8fd8c6c09' || 'YOUR_API_KEY',
});

async function getResponseFromAI() {
  const result = await client.chat.completions.create({
    model: 'inkeep-contextual-gpt-4-turbo', // ai model
    messages: [{ role: 'user', content: 'Why Inkeep?' }],
    functions: [
      {
        name: 'provideLinks',
        description: 'Provides links',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            links: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string', nullable: true },
                  url: { type: 'string' },
                  title: { type: 'string', nullable: true },
                  description: { type: 'string', nullable: true },
                  type: { type: 'string', nullable: true },
                  breadcrumbs: {
                    type: 'array',
                    items: { type: 'string' },
                    nullable: true,
                  },
                },
              },
              nullable: true,
            },
          },
          required: ['text', 'links'],
        },
      },
    ],
  });

  // Check if the function is called in the response
  const functionCall = result.choices[0]?.message?.function_call;
  if (functionCall?.name === 'provideLinks') {
    const functionArgs = JSON.parse(functionCall.arguments as string);
    await provideLinks(functionArgs);
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
