'use client'

import { useUIState, useAIState, useActions } from 'ai/rsc'
import { Message } from 'ai'
import { UIState } from '@/lib/chat/actions'
import { nanoid } from '@/lib/chat/utils'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, className }: ChatProps) {
  const [messages] = useUIState()

  return (
    <div className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
      <div className={'pb-[200px] pt-4 md:pt-10'}>
        <ChatList messages={messages} />
        <div className="w-full h-px" />
      </div>
    </div>
  )
}

export interface ChatList {
  messages: UIState
}

export function ChatList({ messages }: ChatList) {
  const [messagesUIState, setMessagesUIState] = useUIState()
  const { submitUserMessage } = useActions()

  const handleSubmit = async (e: any) => {
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
    setMessagesUIState(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <div>{userMessage.content}</div>
      }
    ])

    // Submit and get response message
    const responseMessage = await submitUserMessage(value)
    setMessagesUIState(currentMessages => [...currentMessages, responseMessage])
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
