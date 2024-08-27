## Vercel AI SDK QA Mode Example

This example demonstrates how to use the Vercel AI SDK with Inkeep's ["QA" mode](https://docs.inkeep.com/ai-api/openai-chat-completion-endpoint#question-answer-qa-mode), which is designed for customer-facing support bot scenarios. 

It showcases two different implementation approaches:

1. React Server Component Implementation - recommended for full-stack React applications
2. Route Handler Implementation (using 'useChat') - recommended for any front-end client

Both implementations showcase the use of the `provideLinks` tool to display sources used to generate responses.

### React Server Component Implementation

Utilizes server-side streaming with React Server Components.

Key files:
- [`components/chat.tsx`](components/chat.tsx): Chat UI component
- [`lib/chat/actions.tsx`](lib/chat/actions.tsx): Server actions for chat functionality
- [`app/page.tsx`](app/page.tsx): Main page component


### Route Handler Implementation

Uses the `useChat` hook for client-side streaming.

Key files:
- [`app/api/chat/route.ts`](app/api/chat/route.ts): API route handler
- [`app/useChat/page.tsx`](app/useChat/page.tsx): Client-side page using `useChat`