import { AIMessage } from "langchain";
import {
	getSystemPrompt,
	getUserPromptTemplate,
	MessageSchema,
} from "../../prompts/v1/messageGenerator.ts";
import type { OpenRouterService } from "../../services/openRouterService.ts";
import type { GraphState } from "../graph.ts";

export function createMessageGeneratorNode(llmClient: OpenRouterService) {
	return async (state: GraphState): Promise<Partial<GraphState>> => {
		console.log(`💬 Generating response message...`);

		try {
			const hasSuccess = state.actionSuccess ? "success" : "error";

			const scenario = `${state.intent ?? "unknown"}_${hasSuccess}`;

			const details = {
				professionalName: state.professionalName,
				dateTime: state.datetime,
				patient: state.patientName,
			};

			const systemPrompt = getSystemPrompt();
			const userPrompt = getUserPromptTemplate({ scenario, details });

			const result = await llmClient.generateSctructured(
				systemPrompt,
				userPrompt,
				MessageSchema,
			);

			console.log(
				"Mensagem gerada",
				result.data?.message ?? result.data ?? result,
			);

			if (result.error) {
				console.log(`Geração da mensagem falhou ${result.error}`);

				return {
					messages: [...state.messages, new AIMessage("Desculpe, errei!")],
				};
			}

			return {
				messages: [...state.messages, new AIMessage(result.data!.message)],
			};
		} catch (error) {
			console.error("❌ Error in messageGenerator node:", error);
			return {
				...state,
				messages: [
					...state.messages,
					new AIMessage("An error occurred while processing your request."),
				],
			};
		}
	};
}
