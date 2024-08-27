import 'server-only'

import { createAI, getMutableAIState, streamUI } from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'
import type { CoreMessage, Message } from 'ai'
import { nanoid } from '@/lib/nanoid'
import {
  ProvideAIAnnotationsToolSchema,
  ProvideLinksToolSchema
} from '@/lib/chat/inkeep-qa-schema'
import type { z } from 'zod'
import { MessageUI } from './Message'
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
      ...aiState
        .get()
        .messages.filter(message => message.role !== 'tool')
        .map(
          message =>
            ({
              role: message.role,
              content: message.content,
              id: message.id
            }) as CoreMessage
        )
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
        parameters: ProvideLinksToolSchema,
        generate: async ({ links }) => {
          console.log('links', links)
          // gets executed when provideLinks is returned from the LLM
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

          aiState.update({
            ...aiState.get(),
            messages: [
              ...currentMessages.slice(0, -1),
              lastMessageWithToolResults
            ]
          })

          return <MessageUI message={lastMessageWithToolResults} />
        }
      },
      provideAIAnnotations: {
        parameters: ProvideAIAnnotationsToolSchema,
        generate: async ({ aiAnnotations }) => {
          console.log('aiAnnotations', aiAnnotations)
          const lastMessage =
            aiState.get().messages[aiState.get().messages.length - 1]

          const lastMessageWithToolResults = {
            ...lastMessage,
            toolInvocations: [
              {
                toolName: 'provideAIAnnotations',
                result: aiAnnotations
              }
            ]
          } as Message

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages.slice(0, -1),
              lastMessageWithToolResults
            ]
          })

          // e.g. conditionally render on e.g. aiAnnotations.answerConfidence === 'very_confident'
          return <MessageUI message={lastMessageWithToolResults} />
          // gets executed when provideAIAnnotations is returned from the LLM
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
