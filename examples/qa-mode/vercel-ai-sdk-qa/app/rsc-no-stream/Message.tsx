import type {
  ProvideAIAnnotationsToolSchema,
  ProvideLinksToolSchema
} from '@/lib/chat/inkeep-qa-schema'
import type { Message } from 'ai'
import type { z } from 'zod'

type MessageUIProps = {
  message: Message
}

export const MessageUI: React.FC<MessageUIProps> = ({ message }) => {
  const { content, toolInvocations } = message
  const links = toolInvocations?.find(tool => tool.toolName === 'provideLinks')
    ?.args as z.infer<typeof ProvideLinksToolSchema>['links']
  const aiAnnotations = toolInvocations?.find(
    tool => tool.toolName === 'provideAIAnnotations'
  )?.args as z.infer<typeof ProvideAIAnnotationsToolSchema>['aiAnnotations']
  return (
    <div>
      <div>{content}</div>
      {links && links.length > 0 && (
        <div>
          <p>Sources:</p>
          <ol>
            {links.map((link, index) => (
              <li key={index}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title || link.label || 'Untitled'}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
      {aiAnnotations && (
        <div>
          <p>AI Annotations:</p>
          <pre>{JSON.stringify(aiAnnotations, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
