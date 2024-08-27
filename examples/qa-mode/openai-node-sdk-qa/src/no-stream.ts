import type OpenAI from "openai";
import type { z } from "zod";
import {
	InkeepQAToolsSchema,
	inkeepQAToolsForChatCompletion,
	type InkeepQATools,
} from "./inkeep-qa-tools-helpers";
import { client } from "./client";

// example message handler
const renderMessage = (message: string) => {
	console.log("\nMessage: ", message);
};

// Tool handlers
type ToolHandlers = {
	[K in keyof InkeepQATools]: (
		args: z.infer<InkeepQATools[K]["schema"]>,
	) => Promise<void>;
};

const toolHandlers: ToolHandlers = {
	provideLinks: async (args) => {
		console.log("Providing links:", args.links);
	},
	provideAIAnnotations: async (args) => {
		console.log("Providing AI annotations:", args.aiAnnotations);
	},
};

const executeTool = async (
	toolCall: OpenAI.Chat.ChatCompletionMessageToolCall,
) => {
	const { name, arguments: args } = toolCall.function;

	try {
		const tool = InkeepQAToolsSchema[name];
		const parsedArgs = tool.schema.parse(JSON.parse(args));
		const handler = toolHandlers[name];
		await handler(parsedArgs);
	} catch (error) {
		console.error(`Error executing tool call for ${name}:`, error);
	}
};

async function getResponseFromAI() {
	try {
		const result = await client.chat.completions.create({
			model: "inkeep-qa-expert",
			messages: [
				{ role: "user", content: "How do I get started? Be succinct." },
			],
			tools: inkeepQAToolsForChatCompletion,
			tool_choice: "auto",
		});
		for (const choice of result.choices) {
			const { message, finish_reason } = choice;

			// Handle content
			if (message?.content) {
				renderMessage(message.content);
			}

			// Handle tool calls
			if (finish_reason === "tool_calls" && message?.tool_calls) {
				console.log("Tool calls:", message.tool_calls);
				for (const toolCall of message.tool_calls) {
					if (toolCall.type === "function") {
						try {
							await executeTool(toolCall);
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
getResponseFromAI().catch((error) =>
	console.error("Error in getResponseFromAI:", error),
);
