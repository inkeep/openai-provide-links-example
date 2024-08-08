import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { nanoid } from '@/lib/chat/utils'

export default async function IndexPage() {
  const id = nanoid()

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      <Chat id={id} />
    </AI>
  )
}
