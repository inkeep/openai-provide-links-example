import OpenAI from 'openai';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { inkeepQATools, inkeepQAToolsForChatCompletion, type InkeepQATools } from './inkeepQAToolsSchema';

if (!process.env.INKEEP_API_KEY) {
  throw new Error('INKEEP_API_KEY is required');
}

const client = new OpenAI({
  baseURL: 'https://api.inkeep.com/v1/',
  apiKey: process.env.INKEEP_API_KEY,
});

// example message handler
const renderMessage = (message: string) => {
  console.log("\nMessage: ", message);
}

// example provideLinks handler
const provideLinks = async (args: z.infer<typeof inkeepQATools.provideLinks.schema>) => {
  console.log("\nLinks used in response: ", args.links);
};

// Tool handlers
const toolHandlers: {
  [K in keyof InkeepQATools]: (args: z.infer<InkeepQATools[K]['schema']>) => Promise<void>
} = {
  provideLinks
};

// Process a single tool call
const executeToolCall = async (toolCall: OpenAI.Chat.ChatCompletionMessageToolCall) => {
  const { name, arguments: args } = toolCall.function;

  const toolName = name as keyof InkeepQATools;
  const tool = inkeepQATools[toolName];
  const handler = toolHandlers[toolName];

  if (!tool || !handler) {
    console.log(`No handler defined for tool: ${toolName}`);
    return;
  }

  const parsedArgs = tool.schema.parse(JSON.parse(args));
  await handler(parsedArgs);
};

async function getResponseFromAI() {
  try {
    const result = await client.chat.completions.create({
      model: "inkeep-qa-expert",
      messages: [{ role: 'user', content: 'How do I get started?' }],
      tools: inkeepQAToolsForChatCompletion,
      tool_choice: 'auto',
    });
    for (const choice of result.choices) {
      const { message, finish_reason } = choice;

      // Handle content
      if (message?.content) {
        renderMessage(message.content);
      }

      // Handle tool calls
      if (finish_reason === 'tool_calls' && message?.tool_calls) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.type === 'function') {
            try {
              await executeToolCall(toolCall);
            } catch (error) {
              console.error("Error executing tool call:", error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in getResponseFromAI:", error);
  }
}

// Run the main function
getResponseFromAI().catch((error) => console.error("Error in getResponseFromAI:", error));