import type { ChatCompletionTool } from "openai/resources";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const InkeepRecordTypes = z.enum([
	"documentation",
	"site",
	"discourse_post",
	"github_issue",
	"github_discussion",
	"stackoverflow_question",
	"discord_forum_post",
	"discord_message",
	"custom_question_answer",
]);

const LinkType = z.union([
	InkeepRecordTypes,
	z.string(), // catch all
]);

const LinkSchema = z
	.object({
		label: z.string().nullish(), // the value of the footnote, e.g. `1`
		url: z.string(),
		title: z.string().nullish(),
		type: LinkType.nullish(),
		breadcrumbs: z.array(z.string()).nullish(),
	})
	.passthrough();

export const LinksSchema = z.array(LinkSchema).nullish();

export const LinksToolSchema = z.object({
	links: LinksSchema,
});

// Define a type for the tool schema
type ToolSchemaType = {
	name: z.ZodLiteral<string>;
	schema: z.ZodTypeAny;
};

// Define a function to create a tool schema
const createToolSchema = <T extends string, S extends z.ZodTypeAny>(
	name: T,
	schema: S,
): ToolSchemaType => ({
	name: z.literal(name),
	schema: schema,
});

// Define available tools
export const inkeepQATools = {
	provideLinks: createToolSchema("provideLinks", LinksToolSchema),
	// Add other Inkeep tools
};

export type InkeepQATools = typeof inkeepQATools;

export const inkeepQAToolsForChatCompletion = Object.entries(inkeepQATools).map(
	([toolName, tool]) => ({
		type: "function",
		function: {
			name: toolName,
			parameters: zodToJsonSchema(tool.schema),
		},
	}),
) as ChatCompletionTool[]; // for 'tools' property in ChatCompletionCreate
