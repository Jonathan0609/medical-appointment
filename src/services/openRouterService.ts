import { ChatOpenAI } from "@langchain/openai";
import {
	createAgent,
	HumanMessage,
	providerStrategy,
	SystemMessage,
} from "langchain";
import type { z } from "zod";
import { config, type ModelConfig } from "../config.ts";

export { ChatOpenAI } from "@langchain/openai";

export class OpenRouterService {
	private config: ModelConfig;
	private llmClient: ChatOpenAI;

	constructor(configOverride?: ModelConfig) {
		this.config = configOverride ?? config;

		this.llmClient = new ChatOpenAI({
			apiKey: this.config.apiKey,
			modelName: this.config.models.at(0),
			temperature: this.config.temperature,
			configuration: {
				baseURL: "https://openrouter.ai/api/v1",
				defaultHeaders: {
					"HTTP-Referer": this.config.httpReferer,
					"X-Title": this.config.xTitle,
				},
			},

			//config do open router (smart model)
			modelKwargs: {
				models: this.config.models,
				provider: this.config.provider,
			},
		});
	}

	async generateSctructured<T>(
		systemPrompt: string,
		userPrompt: string,
		schema: z.ZodSchema<T>,
	) {
		try {
			const agent = createAgent({
				model: this.llmClient,
				tools: [],
				responseFormat: providerStrategy(schema),
			});

			const messages = [
				new SystemMessage(systemPrompt),
				new HumanMessage(userPrompt),
			];

			const data = await agent.invoke({ messages });

			return {
				success: true,
				data: data.structuredResponse,
			};
		} catch (error) {
			console.error("Error OpenRouterService", error);

			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}
}
