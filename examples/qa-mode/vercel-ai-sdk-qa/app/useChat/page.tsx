'use client'

import { useChat } from 'ai/react'

export default function Page() {
  const { messages, isLoading, input, handleSubmit, handleInputChange } =
    useChat({
      streamMode: 'stream-data',
      sendExtraMessageFields: true,
      onResponse(response) {
        if (response.status === 401) {
          console.error(response.statusText)
        }
      }
    })

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.content}
        </div>
      ))}

      {isLoading && <div>Loading...</div>}

      <form onSubmit={handleSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} />
        <button type="submit">Submit</button>
      </form>
    </>
  )
}
