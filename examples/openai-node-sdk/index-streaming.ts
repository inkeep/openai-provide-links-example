import OpenAI from "openai";
import { z } from "zod";
import {
	inkeepQATools,
	inkeepQAToolsForChatCompletion,
	type InkeepQATools,
} from "./inkeepQAToolsSchema";

// Ensure the API key is set
if (!process.env.INKEEP_API_KEY) {
	throw new Error("INKEEP_API_KEY is required");
}

// Initialize OpenAI client with Inkeep's base URL
const client = new OpenAI({
	baseURL: "https://api.inkeep.com/v1/",
	apiKey: process.env.INKEEP_API_KEY,
});

/*====================================*/
/* GENERIC PARTIAL TOOL CALL HANDLING */

// Define the schema for partial tool calls
const PartialToolCallSchema = z.object({
	id: z.string().optional(),
	type: z.literal("function"),
	function: z
		.object({
			name: z.string(),
			arguments: z.string(),
		})
		.partial(),
});

type PartialToolCall = z.infer<typeof PartialToolCallSchema>;

function updateToolCall(
	currentToolCall: PartialToolCall | null,
	newToolCallData: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall,
): PartialToolCall {
	// Merge the new tool call data with the existing data
	return PartialToolCallSchema.parse({
		id: newToolCallData.id ?? currentToolCall?.id ?? "",
		type: "function",
		function: {
			name:
				(currentToolCall?.function?.name ?? "") +
				(newToolCallData.function?.name ?? ""),
			arguments:
				(currentToolCall?.function?.arguments ?? "") +
				(newToolCallData.function?.arguments ?? ""),
		},
	});
}

/* HANDLERS FOR DISPLAYING MESSAGE AND TOOL CALLS (ADD YOUR CUSTOM LOGIC HERE) */

// example cumulative message handler
const renderMessage = (message: string) => {
	console.log("\nMessage: ", message);
};

// example provideLinks handler
const provideLinks = async (
	args: z.infer<typeof inkeepQATools.provideLinks.schema>,
) => {
	console.log("\nLinks used in response: ", args.links);
};

// Tool handlers
const toolHandlers: {
	[K in keyof InkeepQATools]: (
		args: z.infer<InkeepQATools[K]["schema"]>,
	) => Promise<void>;
} = {
	provideLinks,
};

// Process a single tool call
const executeToolCall = async (toolCall: PartialToolCall) => {
	const { name, arguments: args } = toolCall.function;
	if (!name || !args) return;

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

/*====================================*/
/* CALLING INKEEP QA */

async function getResponseFromAI() {
	// Create a streaming chat completion
	const stream = await client.chat.completions.create({
		model: "inkeep-qa-expert",
		messages: [{ role: "user", content: "How do I get started? Be concise." }],
		tools: inkeepQAToolsForChatCompletion,
		tool_choice: "auto",
		stream: true,
	});

	let fullContent = "";
	let latestToolCall: PartialToolCall | null = null; // accumulate the latest tool call

	// Process the stream
	for await (const chunk of stream) {
		// Accumulate content if present
		if (chunk.choices[0]?.delta?.content) {
			fullContent += chunk.choices[0].delta.content;
			renderMessage(fullContent);
		}

		// Process tool calls
		if (chunk.choices[0]?.delta?.tool_calls?.[0]) {
			latestToolCall = updateToolCall(
				latestToolCall,
				chunk.choices[0].delta.tool_calls[0],
			);

			if (
				!(latestToolCall.function.arguments && latestToolCall.function.name)
			) {
				continue;
			}

			try {
				await executeToolCall(latestToolCall);
				latestToolCall = null; // Reset after successful execution
			} catch (error) {
				// If error is unrelated to parsing the tool call, reset the tool call
        if (!(error instanceof SyntaxError) && !(error instanceof z.ZodError)) {
          console.error("Error executing tool call:", error);
          latestToolCall = null; // Reset on other errors
        }
			}
		}
	}
}

// Run the main function
getResponseFromAI().catch((error) =>
	console.error("Error in getResponseFromAI:", error),
);
