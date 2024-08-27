
/* Generic typings for tools */

import { z } from "zod";
import { ProvideAIAnnotationsToolSchema, ProvideLinksToolSchema } from "./inkeep-qa-schema";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

// Define a function to create a tool schema
const createToolSchema = <T extends string, S extends z.ZodTypeAny>(
	name: T,
	schema: S
): {
	name: z.ZodLiteral<T>;
	schema: S;
} => ({
	name: z.literal(name),
	schema: schema,
});


// comment out any tools you don't want to use
export const InkeepQAToolsSchema = {
	provideLinks: createToolSchema("provideLinks", ProvideLinksToolSchema),
	provideAIAnnotations: createToolSchema("provideAIAnnotations", ProvideAIAnnotationsToolSchema),
	// Add other Inkeep tools
};

export type InkeepQATools = typeof InkeepQAToolsSchema;

export const inkeepQAToolsForChatCompletion = Object.entries(InkeepQAToolsSchema).map(
	([toolName, tool]) => ({
		type: "function",
		function: {
			name: toolName,
			parameters: zodToJsonSchema(tool.schema),
		},
	}),
) as ChatCompletionTool[]; // for 'tools' property in ChatCompletionCreate