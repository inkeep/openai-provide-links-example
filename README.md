# OpenAI Provide Links Example

## Getting Started

1. Clone the repository:

   ```sh
   git clone <repository_url>
   cd examples/qa-mode/openai-node-sdk
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

#### Prerequisites

- Node.js v22.3.0 or higher
- npm (Node Package Manager)

## OpenAI Node SDK Example

This is an example project demonstrating the use of the OpenAI Node SDK with TypeScript.

1. Set your OpenAI API key in `index.ts`:

   ```typescript
   const client = new OpenAI({
     baseURL: "https://api.inkeep.com/v1/",
     apiKey: "YOUR_API_KEY",
     // dangerouslyAllowBrowser: true, // use this setting if you are using this in browser
   });
   ```

2. Run the project:

   ```sh
   npm start
   ```

## Vercel AI SDK Example

This is an example project demonstrating the use of the Vercel AI SDK with TypeScript.

1. Set your OpenAI API key in `index.ts`:

   ```typescript
   const openai = createOpenAI({
     baseURL: "https://api.inkeep.com/v1/",
     apiKey: "YOUR_API_KEY",
   });
   ```

2. Run the project:

   ```sh
   npm start
   ```

## Project Structure

## qa-mode

The `qa` models are specifically tailored for customer-facing support bot scenarios. More information in our [docs](https://docs.inkeep.com/ai-api/openai-chat-completion-endpoint#question-answer-qa-mode).

### openai-node-sdk-qa

- `index.ts`: Main entry point of the application. It demonstrates how to use the OpenAI Node SDK to create a chat completion and handle tools.
- `LinksToolSchema.ts`: Contains Zod schemas used for validating data structures.

### vercel-ai-sdk-qa

Open localhost:3000 to see a basic AI application that uses Vercel AI SDK. These examples show how to set up the `provideLinks` tool call, and how to stream the response to the client.

#### Route handler implementation

- `app/api/chat/route.ts`: Route handler implementation for the chat endpoint.
- `app/useChat/page.tsx`: Page implementation that uses `useChat` to stream a response from the server. Go to localhost:3000/useChat to see the page.

#### React Server Component implementation

- `components/chat.tsx`: Chat client component that renders the response messages that are streamed from the server. This also has a form that calls `submitUserMessage` with the form's input value.
- `lib/chat/actions.tsx`: `submitUserMessage` calls `streamUI` with relevant configuration to stream the response to the client and handle tool calling.
- `inkeep-qa-schema.ts`: Contains Zod schemas used for validating data structures.

## contextual-mode

These examples show how to set up the API calls that use Inkeep's contextual mode, and how to stream a structured JSON response to the client. More information regarding Inkeep's contextual mode can be found in our [docs](https://docs.inkeep.com/ai-api/openai-chat-completion-endpoint#contextual-mode).

### vercel-ai-sdk

- `index.ts`: Main entry point of the application.
- `LinksToolSchema.ts`: Contains Zod schemas used for validating data structures.

## Dependencies

- `openai`: OpenAI's official Node.js client.

- `@ai-sdk/openai`: SDK for interacting with OpenAI's API.
- `ai`: Library for AI tools.
- `openai`: OpenAI's official Node.js client.
- `zod`: TypeScript-first schema declaration and validation library.

### Development Dependencies

- `tsx`: TypeScript execution environment.

- `typescript`: TypeScript language.
