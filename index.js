import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { LinksToolSchema } from "./provideLinksSchema.js";

const openai = createOpenAI({
  baseURL: "https://api.inkeep.com/v1/",
  apiKey: "YOUR API KEY",
});

const getResponse = async () => {
  const result = await streamText({
    model: openai("inkeep-contextual-gpt-4-turbo"),
    tools: {
      provideLinks: tool({
        parameters: LinksToolSchema,
        description: "Provides links",
        execute: provideLinks,
      }),
    },
    toolChoice: { toolName: "provideLinks", type: "tool" },
    prompt: "What is inkeep?",
  });
};

async function provideLinks({ links, text }) {
  console.log("Streamed text: ", text);
  console.log("\nLinks used in response: ", links);

  //must return promise
  return Promise.resolve();
}

getResponse();
