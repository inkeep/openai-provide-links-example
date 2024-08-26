import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

/* Generic typings for tools */
type ToolSchemaType = {
	name: z.ZodLiteral<string>;
	schema: z.ZodTypeAny;
};

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
/* Inkeep QA Tools */

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

export const ProvideLinksToolSchema = z.object({
	links: LinksSchema,
});

const AnswerConfidence = z.union([
	z.literal("very_confident").describe("Confident answer, no hesitation"),
	z
		.literal("somewhat_confident")
		.describe("Answer addresses question with minor uncertainties"),
	z
		.literal("not_confident")
		.describe("Suggestions provided, no direct answer in sources"),
	z.literal("no_sources").describe("No relevant information found"),
	z.literal("other").describe("Unclear question or unrelated to product"),
	z.string().describe("catch all"),
]);

const AIAnnotationsToolSchema = z.object({
	answerConfidence: AnswerConfidence,
}).passthrough();

const ProvideAIAnnotationsToolSchema = z.object({
	aiAnnotations: AIAnnotationsToolSchema,
});

/* Available tools */

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


console.log(JSON.stringify(inkeepQAToolsForChatCompletion, null, 2));