import 'server-only'

import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, type CoreMessage, type Message } from 'ai'
import { nanoid } from '@/lib/nanoid'
import {
  ProvideAIAnnotationsToolSchema,
  ProvideLinksToolSchema
} from '@/lib/chat/inkeep-qa-schema'
import type { z } from 'zod'

const openai = createOpenAI({
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: 'https://api.inkeep.com/v1'
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
  content: React.ReactNode
  AnnotationsUI: React.ReactNode
  LinksUI: React.ReactNode
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

  const messageWrapper = createStreamableUI()
  const messageContent = createStreamableUI()
  const messageAnnotations = createStreamableUI()
  const messageLinks = createStreamableUI()

  messageWrapper.update(
    <MessageUI
      content={messageContent.value}
      AnnotationsUI={messageAnnotations.value}
      LinksUI={messageLinks.value}
    />
  )

  // We need to wrap this in an async IIFE to avoid blocking.
  ;(async () => {
    const { textStream, toolResults } = streamText({
      model: openai('inkeep-qa-sonnet-3-5'),
      messages: aiState
        .get()
        .filter(message => message.role !== 'tool')
        .map(
          message =>
            (({
              role: message.role,
              content: message.content,
              id: message.id
            }) as CoreMessage)
        ),
      tools: {
        provideLinks: {
          parameters: ProvideLinksToolSchema,
          execute: async ({ links }) => {
            console.log('executing provideLinks', links)
            return links
          }
        },
        provideAIAnnotations: {
          parameters: ProvideAIAnnotationsToolSchema,
          execute: async ({ aiAnnotations }) => {
            console.log('executing provideAIAnnotations', aiAnnotations)
            return aiAnnotations
          }
        }
      },
      toolChoice: 'auto'
    })

    console.log("hello!!!");

    let newMessageContent = ''

    for await (const textPart of textStream) {
      console.log('textPart', textPart)
      newMessageContent += textPart
      messageContent.update(<div>{newMessageContent}</div>)
    }
    messageContent.done(<div>{newMessageContent}</div>)

    const allToolResults = await toolResults;
console.log('All tool results:', allToolResults);

const annotationsResult = allToolResults.find(result => result.toolName === 'provideAIAnnotations');
const linksResult = allToolResults.find(result => result.toolName === 'provideLinks');

if (annotationsResult) {
  messageAnnotations.done(<AnnotationsUI aiAnnotations={annotationsResult.result} />)
}
if (linksResult) {
  messageLinks.done(<LinksUI links={linksResult.result} />)
}

messageWrapper.done(
  <MessageUI
    content={messageContent.value}
    AnnotationsUI={messageAnnotations.value}
    LinksUI={messageLinks.value}
  />
)})()


  //   await Promise.all(
  //     (await toolResults).map(async toolResult => {
  //       console.log('toolResult', toolResult)
  //       if (toolResult.toolName === 'provideAIAnnotations') {
  //         messageAnnotations.done(<AnnotationsUI aiAnnotations={toolResult.result} />)
  //       }
  //       if (toolResult.toolName === 'provideLinks') {
  //         messageLinks.done(<LinksUI links={toolResult.result} />)
  //       }
  //     })
  //   ).then(() => {
  //     console.log('==========done')
  //     messageWrapper.done(
  //       <MessageUI
  //         content={messageContent.value}
  //         AnnotationsUI={messageAnnotations.value}
  //         LinksUI={messageLinks.value}
  //       />
  //     )
  //   })
  // })()

  console.log("initi");

  return {
    id: nanoid(),
    display: messageWrapper.value
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
