'use client'

import { useUIState, useActions } from 'ai/rsc'
import type { Message } from 'ai'
import type { AI, AIActions } from './assistant-fundementals'
import { nanoid } from '@/lib/nanoid'

export function Chat() {
  return (
    <div className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
      <div className={'pb-[200px] pt-4 md:pt-10'}>
        <ChatList />
        <div className="w-full h-px" />
      </div>
    </div>
  )
}

export function ChatList() {
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions() as AIActions

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.currentTarget
    const input = form.elements.namedItem('prompt') as HTMLInputElement

    const value = input.value.trim()
    if (!value) return

    input.value = '' // Clear the input after submission

    const userMessage = {
      id: nanoid(),
      content: value,
      role: 'user'
    } as Message

    // Optimistically add user message UI
    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <div>{userMessage.content}</div>
      }
    ])

    // Submit and get response message
    const responseMessage = await submitUserMessage(value)
    setMessages(currentMessages => [...currentMessages, responseMessage])
  }

  return (
    <>
      <div className="relative mx-auto max-w-2xl px-4">
        {messages.map(message => (
          <div key={message.id}>{message.display}</div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input name="prompt" />
        <button type="submit">Submit</button>
      </form>
    </>
  )
}
