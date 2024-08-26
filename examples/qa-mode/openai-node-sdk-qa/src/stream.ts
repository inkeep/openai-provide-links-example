import { z } from "zod";
import {
	InkeepQAToolsSchema,
	inkeepQAToolsForChatCompletion,
	type InkeepQATools,
} from "./inkeep-qa-schema";
import { client } from "./client";
import type OpenAI from "openai";

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

// Merge the new tool call delta with the existing data
function updateToolCall(
	currentToolCall: PartialToolCall | null,
	newToolCallData: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall,
): PartialToolCall {
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
	// console.log("\nMessage: ", message);
};

// Tool handlers
const toolHandlers: {
	[K in keyof InkeepQATools]: (
		args: z.infer<InkeepQATools[K]["schema"]>,
	) => Promise<void>;
} = {
	provideLinks: async (args) => {
		console.log("\nLinks used in response: ", args.links);
	},
	provideAIAnnotations: async (args) => {
		console.log("\nAI annotations used in response: ", args);
	},
};

function isValidToolName(name: string): name is keyof InkeepQATools {
	return name in InkeepQAToolsSchema;
}

function executeHandler<T extends keyof InkeepQATools>(
	name: T,
	args: z.infer<InkeepQATools[T]["schema"]>,
) {
	const handler = toolHandlers[name];
	return handler(args);
}

// Process a single tool call
const executeToolCall = async (toolCall: PartialToolCall) => {
	const { name, arguments: args } = toolCall.function;
	if (!name || !args) return;

	if (!isValidToolName(name)) {
		console.log(`Invalid tool name: ${name}`);
		return;
	}

	const tool = InkeepQAToolsSchema[name];

	try {
		const parsedArgs = tool.schema.parse(JSON.parse(args));
		await executeHandler(name, parsedArgs as z.infer<typeof tool.schema>);
	} catch (error) {
		if (error instanceof SyntaxError || error instanceof z.ZodError) {
			// Incomplete tool call, continue accumulating
			return;
		}
		console.error("Error executing tool call:", error);
	}
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

		// Process tool calls, execute them as they are streamed in
		if (chunk.choices[0]?.delta?.tool_calls?.[0]) {
			latestToolCall = updateToolCall(
				latestToolCall,
				chunk.choices[0].delta.tool_calls[0],
			);

			console.log("\nLatest tool call: ", latestToolCall);

			if (
				!(latestToolCall.function.arguments && latestToolCall.function.name)
			) {
				continue;
			}

			try {
				console.log("\nTool call: ", latestToolCall);
				await executeToolCall(latestToolCall);
				latestToolCall = null; // Reset after successful execution
			} catch (error) {
				// If error is unrelated to parsing the tool call, reset the tool call
				if (!(error instanceof SyntaxError) && !(error instanceof z.ZodError)) {
					console.error("Error executing tool call:", error);
					latestToolCall = null; // Reset on other errors
				}
				// Otherwise, continue accumulating it. Error just means incomplete tool call
			}
		}
	}
}

// Run the main function
getResponseFromAI().catch((error) =>
	console.error("Error in getResponseFromAI:", error),
);
