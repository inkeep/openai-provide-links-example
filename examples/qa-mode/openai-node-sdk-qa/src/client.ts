import OpenAI from "openai";
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(__dirname, '../.env') });

if (!process.env.INKEEP_API_KEY) {
  throw new Error('INKEEP_API_KEY is required');
}

// Initialize OpenAI client with Inkeep's base URL
export const client = new OpenAI({
	baseURL: "https://api.inkeep.com/v1",
	apiKey: process.env.INKEEP_API_KEY,
});