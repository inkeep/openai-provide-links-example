import OpenAI from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { inkeepQATools, type InkeepQATools } from "./inkeepQATools";

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
			name: (currentToolCall?.function?.name ?? "") + (newToolCallData.function?.name ?? ""),
			arguments:
				(currentToolCall?.function?.arguments ?? "") + (newToolCallData.function?.arguments ?? ""),
		},
	});
}

// attempts to execute a tool call, fails if incomplete
async function attemptToolCallProcessing(toolCall: PartialToolCall | null) {
  const { name, arguments: args } = toolCall?.function ?? {};
  if (!name || !args) return;

  try { 
    const toolName = name as keyof InkeepQATools;
    const tool = inkeepQATools[toolName];
    
    if (!tool) {
      console.log(`Unknown tool: ${toolName}`);
      return;
    }

    const validatedArgs = tool.schema.parse(JSON.parse(args)); 
    await executeToolCall(toolName, validatedArgs);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      console.error("Error executeing tool call:", error);
    }
  }
}


/* HANDLERS FOR DISPLAYING MESSAGE AND TOOL CALLS (ADD YOUR CUSTOM LOGIC HERE) */

// example cumulative message handler
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
	args: z.infer<InkeepQATools[T]["schema"]>,
) {
	switch (toolName) {
		case "provideLinks":
			await provideLinks(args);
			break;
		default:
			console.log(`No executeor defined for tool: ${toolName}`);
	}
}

/*====================================*/
/* CALLING INKEEP QA */

async function getResponseFromAI() {
	// Create a streaming chat completion
	const stream = await client.chat.completions.create({
		model: "inkeep-qa-sonnet-3-5",
		messages: [{ role: "user", content: "How do I get started?" }],
		tools: Object.entries(inkeepQATools).map(([toolName, tool]) => ({
			type: "function",
			function: {
				name: toolName,
				description: `Provides ${toolName}`,
				parameters: zodToJsonSchema(tool.schema),
			},
		})),
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
			latestToolCall = updateToolCall(latestToolCall, chunk.choices[0].delta.tool_calls[0]);
			await attemptToolCallProcessing(latestToolCall);
		}
	}
}

// Run the main function
getResponseFromAI().catch((error) => console.error("Error in getResponseFromAI:", error));