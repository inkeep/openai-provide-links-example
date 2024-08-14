import OpenAI from "openai";
import { LinksToolSchema } from "./schema";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

if (!process.env.INKEEP_API_KEY) {
	throw new Error("INKEEP_API_KEY is required");
}

const client = new OpenAI({
	baseURL: "https://api.inkeep.com/v1/",
	apiKey: process.env.INKEEP_API_KEY,
});

async function getResponseFromAI() {
	const stream = await client.chat.completions.create({
		model: "inkeep-qa-sonnet-3-5",
		messages: [{ role: "user", content: "How do I get started?" }],
		tools: [
			{
				type: "function",
				function: {
					name: "provideLinks",
					description: "Provides links",
					parameters: zodToJsonSchema(LinksToolSchema),
				},
			},
		],
		tool_choice: "auto",
		stream: true,
	});

	let fullContent = "";

	let currentToolCall: Partial<OpenAI.Chat.Completions.ChatCompletionMessageToolCall> | null =
		null;

	for await (const chunk of stream) {
		if (chunk.choices[0]?.delta?.content) {
			fullContent += chunk.choices[0].delta.content;
      // process partial content
		}

		if (chunk.choices[0]?.delta?.tool_calls) {
			const toolCall = chunk.choices[0].delta.tool_calls[0];
			if (toolCall) {
				if (!currentToolCall) {
					currentToolCall = {
						id: toolCall.id ?? "",
						type: toolCall.type ?? "function",
						function: {
							name: toolCall.function?.name ?? "",
							arguments: toolCall.function?.arguments ?? "",
						},
					};
				} else {
					if (toolCall.function?.name) {
						currentToolCall = currentToolCall ?? {};
						currentToolCall.function = currentToolCall.function ?? {
							name: "",
							arguments: "",
						};
						currentToolCall.function.name += toolCall.function.name;
					}
					if (toolCall.function?.arguments) {
						currentToolCall = currentToolCall ?? {};
						currentToolCall.function = currentToolCall.function ?? {
							name: "",
							arguments: "",
						};
						currentToolCall.function.arguments += toolCall.function.arguments;
					}
				}

				console.log(
					"Current tool call state:",
					JSON.stringify(currentToolCall, null, 2),
				);

				// Check if the tool call is complete
				if (
					currentToolCall.function?.name &&
					currentToolCall.function.arguments
				) {
					try { 
            // attempt to parse the arguments as JSON, call the function
						JSON.parse(currentToolCall.function.arguments);
						await processToolCall(currentToolCall);
						currentToolCall = null;
					} catch (error) { 
						// Arguments are not yet complete JSON, continue accumulating
					}
				}
			}
		}
	}
}

async function processToolCall(
	toolCall: Partial<OpenAI.Chat.Completions.ChatCompletionMessageToolCall>,
) {
	console.log("Processing tool call:", JSON.stringify(toolCall, null, 2));
	if (
		toolCall?.function?.name === "provideLinks" &&
		toolCall.function.arguments
	) {
		try {
			const functionArgs = JSON.parse(toolCall.function.arguments);
			await provideLinks(functionArgs);
		} catch (error) {
			console.error("Error parsing function arguments:", error);
		}
	} else {
		console.log("Tool call not processed: invalid name or missing arguments");
	}
}

// The provideLinks function remains the same
const provideLinks = async ({
	links,
	text,
}: { links?: (typeof LinksToolSchema._type)["links"]; text: string }) => {
	console.log("\nLinks used in response: ", links);
	return Promise.resolve();
};

getResponseFromAI().catch((error) =>
	console.error("Error in getResponseFromAI:", error),
);
