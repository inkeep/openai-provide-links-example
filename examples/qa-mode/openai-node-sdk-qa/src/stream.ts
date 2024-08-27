import { z } from "zod";
import {
	InkeepQAToolsSchema,
	inkeepQAToolsForChatCompletion,
	type InkeepQATools,
} from "./inkeep-qa-tools-helpers";
import { client } from "./client";
import type OpenAI from "openai";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ProvideAIAnnotationsToolSchema, ProvideLinksToolSchema } from "./inkeep-qa-schema";
import type { JSONSchema } from "openai/lib/jsonschema";

const renderMessage = (snapshot: string) => {
	console.log("Content: ", snapshot);
}

async function getResponseFromAI() {
	// Create a streaming chat completion
	const runner = client.beta.chat.completions.stream({
		model: "inkeep-qa-expert",
		messages: [{ role: "user", content: "How do I get started? Be concise." }],
		tools: [
			{
				type: "function",
				function: {
				  name: "provideLinks",
				  description: "",
				  parameters: zodToJsonSchema(ProvideLinksToolSchema) as OpenAI.FunctionParameters,
				},
			  },
			  {
				type: "function",
				function: {
				  name: "provideAIAnnotations",
				  description: "",
				  parameters: zodToJsonSchema(ProvideAIAnnotationsToolSchema) as OpenAI.FunctionParameters,
				},
			  },
		  ],
		tool_choice: "auto",
		// stream: true,
	})

	runner.on("content", (delta, snapshot) => {
		renderMessage(snapshot);
	});

	runner.on("tool_calls.function.arguments.done", (toolCall) => {
		const { name, arguments: args } = toolCall
		console.log("=====", name);
		console.log("Tool call name: ", name);
		console.log("Tool call arguments: ");
		console.log(args);
		switch (name) {
			case "provideLinks": {
				const parsed_arguments = ProvideLinksToolSchema.parse(JSON.parse(args));
				console.log("Links used in response: ", parsed_arguments);
				break;
			}
			case "provideAIAnnotations": {
				const parsed_arguments = ProvideAIAnnotationsToolSchema.parse(JSON.parse(args));
				console.log("AI annotations used in response: ", parsed_arguments);
				break;
			}
		}
	});
}

// Run the main function
getResponseFromAI().catch((error) =>
	console.error("Error in getResponseFromAI:", error),
);