import { z } from 'zod';

import { streamObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai'
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.INKEEP_API_KEY) {
  throw new Error('INKEEP_API_KEY is required');
}

const openai = createOpenAI({
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: 'https://api.inkeep.com/v1'
})

const StepSchema = z.object({
  steps: z.array(z.object({
    step: z.string(),
    description: z.string()
  }))
})

async function getResponseFromAI() {

  const result = await streamObject({
    model: openai('inkeep-contextual-gpt-4-turbo'),
    schema: StepSchema,
    messages: [
      {
        role: 'system',
        content:
          'Generate step-by-step instructions to answer the user question about Inkeep only based on the information sources. Break it down to be as granular as possible. Always generate more than one step.'
      },
    ]
  })

    const { partialObjectStream } = result
    for await (const partialObject of partialObjectStream) {
      console.clear();
      console.log(partialObject.steps)
    }

}

getResponseFromAI();
