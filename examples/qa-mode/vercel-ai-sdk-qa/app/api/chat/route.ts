import { LinksTool } from '@/lib/chat/inkeep-qa-schema'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const runtime = 'edge'

const openai = createOpenAI({
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: 'https://api.inkeep.com/v1'
})

export async function POST(req: Request) {
  const reqJson = await req.json()

  const result = await streamText({
    model: openai('inkeep-qa-sonnet-3-5'),
    tools: {
      provideLinks: {
        ...LinksTool
      }
    },
    messages: reqJson.messages.map((message: any) => ({
      role: message.role,
      content: message.content,
      name: 'inkeep-qa-user-message',
      id: message.id
    })),
    toolChoice: 'auto'
  })

  return result.toAIStreamResponse()
}
