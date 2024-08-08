import 'server-only'

import { createAI, getMutableAIState, streamUI } from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'

import { Message } from 'ai'
import { nanoid } from './utils'
import { LinksTool } from './inkeep-qa-schema'

const openai = createOpenAI({
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: 'https://api.inkeep.com/v1'
})

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  const answerMessageId = nanoid()

  const result = await streamUI({
    model: openai('inkeep-qa-sonnet-3-5'),
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: 'inkeep-qa-user-message',
        id: message.id
      }))
    ],
    text: ({ content }) => {
      const assistantAnswerMessage = {
        id: answerMessageId,
        role: 'assistant',
        content,
        name: 'inkeep-qa-assistant-message'
      } as Message

      const currentMessages = aiState.get().messages
      const lastMessage = currentMessages[currentMessages.length - 1]

      aiState.update({
        ...aiState.get(),
        messages:
          lastMessage?.id === answerMessageId
            ? [...currentMessages.slice(0, -1), assistantAnswerMessage]
            : [...currentMessages, assistantAnswerMessage]
      })

      return <div>{assistantAnswerMessage.content}</div>
    },
    tools: {
      provideLinks: {
        ...LinksTool,
        generate: async ({ links }) => {
          const currentMessages = aiState.get().messages
          const lastMessage = currentMessages[currentMessages.length - 1]
          const lastMessageWithToolResults = {
            ...lastMessage,
            toolInvocations: [
              {
                toolName: 'provideLinks',
                result: links
              }
            ]
          } as Message

          aiState.done({
            ...aiState.get(),
            messages: [
              ...currentMessages.slice(0, -1),
              lastMessageWithToolResults
            ]
          })

          return <div>{lastMessageWithToolResults.content}</div>
        }
      }
    },
    toolChoice: 'auto'
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] }
})
