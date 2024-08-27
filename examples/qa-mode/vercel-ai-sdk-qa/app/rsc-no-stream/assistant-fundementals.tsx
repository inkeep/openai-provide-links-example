import 'server-only'

import { createAI, getMutableAIState } from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText, type CoreMessage, type Message } from 'ai'
import { nanoid } from '@/lib/nanoid'
import {
  ProvideAIAnnotationsToolSchema,
  ProvideLinksToolSchema
} from '@/lib/chat/inkeep-qa-schema'
import type { z } from 'zod'

const openai = createOpenAI({
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: 'https://e9e02e6a1d82.ngrok.app/v1'
})

const AnnotationsUI = ({
  aiAnnotations
}: {
  aiAnnotations: z.infer<typeof ProvideAIAnnotationsToolSchema>['aiAnnotations']
}) => (
  <div className="annotations">
    {Object.entries(aiAnnotations).map(([key, value]) => (
      <div key={key} className="annotation">
        <span className="key">{key}:</span>
        <span className="value">{value}</span>
      </div>
    ))}
  </div>
)

const LinksUI = ({
  links
}: {
  links: z.infer<typeof ProvideLinksToolSchema>['links']
}) => (
  <div className="links">
    {links?.map((link, index) => (
      <a key={index} href={link.url} className="link">
        {link.title}
      </a>
    ))}
  </div>
)

const MessageUI = ({
  content,
  AnnotationsUI,
  LinksUI
}: {
  content?: React.ReactNode
  AnnotationsUI?: React.ReactNode
  LinksUI?: React.ReactNode
}) => (
  <div className="message">
    <div className="content">{content}</div>
    {AnnotationsUI}
    {LinksUI}
  </div>
)

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update([
    ...aiState.get(),
    {
      id: nanoid(),
      role: 'user',
      content
    }
  ])

  const { text, toolResults, toolCalls, rawResponse, responseMessages } = await generateText({
    model: openai('inkeep-qa-expert'),
    // model: openai('gpt-4o'),
    messages: aiState
      .get()
      .filter(message => message.role !== 'tool')
      .map(
        message =>
          ({
            role: message.role,
            content: message.content,
            id: message.id
          }) as CoreMessage
      ),
    tools: {
      provideLinks: {
        parameters: ProvideLinksToolSchema,
        // execute: async ({ links }) => {
        //   console.log('executing provideLinks', links)
        //   return links
        // }
      },
      provideAIAnnotations: {
        parameters: ProvideAIAnnotationsToolSchema,
        // execute: async ({ aiAnnotations }) => {
        //   console.log('executing provideAIAnnotations', aiAnnotations)
        //   return aiAnnotations
        // }
      }
    },
    toolChoice: 'auto',
  })

  console.log('responseMessages', responseMessages)

  console.log('text:', text)

  console.log('rawResponse', JSON.stringify(rawResponse, null, 2))

  console.log('toolCalls', JSON.stringify(toolCalls, null, 2))
  console.log('toolResults', JSON.stringify(toolResults, null, 2))

  const aiAnnotations = toolCalls.find(toolCall => toolCall.toolName === 'provideAIAnnotations')?.args.aiAnnotations as z.infer<typeof ProvideAIAnnotationsToolSchema>['aiAnnotations']
  const links = toolCalls.find(toolCall => toolCall.toolName === 'provideLinks')?.args.links as z.infer<typeof ProvideLinksToolSchema>['links']

  console.log('aiAnnotations', aiAnnotations)
  console.log('links', links)

  const aiAnnotationsArgs = toolCalls.find(toolCall => toolCall.toolName === 'provideAIAnnotations')?.args as z.infer<typeof ProvideAIAnnotationsToolSchema>
  const linksArgs = toolCalls.find(toolCall => toolCall.toolName === 'provideLinks')?.args as z.infer<typeof ProvideLinksToolSchema>

  console.log('aiAnnotations', aiAnnotations)
  console.log('links', links)

  console.log('aiAnnotationsArgs', aiAnnotationsArgs)
  console.log('linksArgs', linksArgs)

  // Await toolResults and process them
  // const processedToolResults = await Promise.all(toolResults.map(async (toolResult) => {
  //   if (toolResult.toolName === 'provideAIAnnotations') {
  //     return {
  //       type: 'annotations',
  //       result: toolResult.result as z.infer<typeof ProvideAIAnnotationsToolSchema>['aiAnnotations']
  //     };
  //   }
  //   if (toolResult.toolName === 'provideLinks') {
  //     return {
  //       type: 'links',
  //       result: toolResult.result as z.infer<typeof ProvideLinksToolSchema>['links']
  //     };
  //   }
  //   return null;
  // }));

  // const aiAnnotations = processedToolResults.find(r => r?.type === 'annotations')?.result;
  // const links = processedToolResults.find(r => r?.type === 'links')?.result;

  // console.log('===aiAnnotations', aiAnnotations);
  // console.log('===links', links);

  return {
    id: nanoid(),
    display: (
      <MessageUI
        content={text}
        // AnnotationsUI={aiAnnotations ? <AnnotationsUI aiAnnotations={aiAnnotations} /> : null}
        LinksUI={links ? <LinksUI links={links} /> : null}
      />
    )
  }
}

export type AIState = Message[]

export type UIState = {
  id: string
  display: React.ReactNode
}[]

const actions = {
  submitUserMessage
}

export type AIActions = typeof actions

export const AI = createAI<AIState, UIState>({
  actions,
  initialUIState: [],
  initialAIState: []
})
