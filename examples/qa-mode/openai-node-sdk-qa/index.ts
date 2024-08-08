import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LinksToolSchema } from './LinksToolSchema';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.INKEEP_API_KEY) {
  throw new Error('INKEEP_API_KEY is required');
}

const client = new OpenAI({
  baseURL: 'https://api.inkeep.com/v1/',
  apiKey: process.env.INKEEP_API_KEY,
  // dangerouslyAllowBrowser: true, use this setting if you are using this in browser
});

async function getResponseFromAI() {
  const result = await client.chat.completions.create({
    model: 'inkeep-qa-sonnet-3-5',
    messages: [{ role: 'user', content: 'How do I get started with Inkeep?' }],
    stream: true,
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
    tool_choice: 'auto',
  });

  let toolCalls: any[] = [];
  for await (const chunk of result) {
    const c = chunk.choices[0]
    process.stdout.write(c.delta.content || '');

    if (c.delta?.tool_calls) {
      c.delta.tool_calls.forEach(toolCall => {
        const existingCall = toolCalls[toolCall.index ?? 0];
        if (existingCall) {
          // Update existing call
          if (toolCall.function) {
            existingCall.function = existingCall.function || {};
            if (toolCall.function.name) existingCall.function.name = toolCall.function.name;
            if (toolCall.function.arguments) {
              existingCall.function.arguments = (existingCall.function.arguments || '') + toolCall.function.arguments;
            }
          }
          if (toolCall.type) existingCall.type = toolCall.type;
        } else {
          // Add new call
          toolCalls[toolCall.index ?? 0] = toolCall;
        }
      });
    }
  }

  // Check if the function is called in the response
  if (toolCalls && toolCalls.length > 0) {
    const provideLinksCall = toolCalls.find(call => call.function.name === 'provideLinks');
    if (provideLinksCall) {
      const functionArgs = JSON.parse(provideLinksCall.function.arguments);
      await provideLinks(functionArgs);
    } else {
      console.log('No provideLinks tool call found');
    }
  }
}

const provideLinks = async ({ links, text }: { links?: (typeof LinksToolSchema._type)['links']; text: string }) => {
  console.log('\nLinks used in response: ', links);

  return Promise.resolve();
};

getResponseFromAI();
