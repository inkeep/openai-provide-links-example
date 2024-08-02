# OpenAI Provide Links Example

## Getting Started

1. Clone the repository:

   ```sh
   git clone <repository_url>
   cd openai-node-sdk-example
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

### openai-node-sdk

- `index.ts`: Main entry point of the application. It demonstrates how to use the OpenAI Node SDK to create a chat completion and handle tools.
- `schema.ts`: Contains Zod schemas used for validating data structures.

### vercel-ai-sdk

- `index.ts`: Main entry point of the application. It demonstrates how to use the Vercel AI SDK to interact with OpenAI's API and implement a custom tool.
- `schema.ts`: Contains Zod schemas used for validating data structures.

## Dependencies

- `openai`: OpenAI's official Node.js client.

- `@ai-sdk/openai`: SDK for interacting with OpenAI's API.
- `ai`: Library for AI tools.
- `openai`: OpenAI's official Node.js client.
- `zod`: TypeScript-first schema declaration and validation library.

### Development Dependencies

- `tsx`: TypeScript execution environment.

- `typescript`: TypeScript language.
