import OpenAI from 'openai';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { inkeepQATools, type InkeepQATools } from './inkeepQATools';

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

// custom tool function handling
async function executeToolCall<T extends keyof InkeepQATools>(
  toolName: T,
  args: z.infer<InkeepQATools[T]['schema']>,
) {
  switch (toolName) {
    case 'provideLinks':
      await provideLinks(args);
      break;
    default:
      console.log(`No executor defined for tool: ${toolName}`);
  }
}

async function getResponseFromAI() {
  const result = await client.chat.completions.create({
    model: 'inkeep-qa-sonnet-3-5',
    messages: [{ role: 'user', content: 'How do I get started?' }],
    tools: Object.entries(inkeepQATools).map(([toolName, tool]) => ({
      type: 'function',
      function: {
        name: toolName,
        description: `Provides ${toolName}`,
        parameters: zodToJsonSchema(tool.schema),
      },
    })),
    tool_choice: 'auto',
  });

  console.log("\nResult: ", result);

  for (const choice of result.choices) {
    const message = choice.message;

    if (message?.content) {
      renderMessage(message.content);
    }

    console.log("\nMessage: ", message);

    if (choice.finish_reason === 'tool_calls' && message?.tool_calls) {
      console.log("\nTool calls: ", message.tool_calls);
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function') {
          const { name, arguments: args } = toolCall.function;
          try {
            const toolName = name as keyof InkeepQATools;
            const tool = inkeepQATools[toolName];
            
            if (!tool) {
              console.log(`Unknown tool: ${toolName}`);
              continue;
            }

            const validatedArgs = tool.schema.parse(JSON.parse(args));
            await executeToolCall(toolName, validatedArgs);
          } catch (error) {
            console.error("Error executing tool call:", error);
          }
        }
      }
    }
  }
}

// Run the main function
getResponseFromAI().catch((error) => console.error("Error in getResponseFromAI:", error));