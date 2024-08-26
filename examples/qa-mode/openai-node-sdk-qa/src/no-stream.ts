import type OpenAI from 'openai';
import type { z } from 'zod';
import { InkeepQAToolsSchema, inkeepQAToolsForChatCompletion, type InkeepQATools } from './inkeep-qa-schema';
import { client } from './client';

// example message handler
const renderMessage = (message: string) => {
  console.log("\nMessage: ", message);
}

// Tool handlers
type ToolHandlers = {
  [K in keyof InkeepQATools]: (args: z.infer<InkeepQATools[K]['schema']>) => Promise<void>;
};

const toolHandlers: ToolHandlers = {
  provideLinks: async (args) => {
    console.log('Providing links:', args.links);
  },
  provideAIAnnotations: async (args) => {
    console.log('Providing AI annotations:', args.aiAnnotations);
  },
};

function isValidToolName(name: string): name is keyof InkeepQATools {
  return name in InkeepQAToolsSchema;
}

function executeHandler<T extends keyof InkeepQATools>(
  name: T,
  args: z.infer<InkeepQATools[T]['schema']>
) {
  const handler = toolHandlers[name];
  return handler(args);
}

const executeToolCall = async (toolCall: OpenAI.Chat.ChatCompletionMessageToolCall) => {
  const { name, arguments: args } = toolCall.function;

  if (!isValidToolName(name)) {
    console.log(`Invalid tool name: ${name}`);
    return;
  }

  const tool = InkeepQAToolsSchema[name];

  try {
    const parsedArgs = tool.schema.parse(JSON.parse(args));
    await executeHandler(name, parsedArgs as z.infer<typeof tool.schema>);
  } catch (error) {
    console.error(`Error executing tool call for ${name}:`, error);
  }
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

        console.log("Tool calls: ", message.tool_calls);
        for (const toolCall of message.tool_calls) {
          console.log("Tool call: ", toolCall);
          if (toolCall.type === 'function') {
            try {
              console.log("Executing tool call: ", toolCall);
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