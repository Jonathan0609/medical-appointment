import { z } from "zod/v3";
import type { AppointmentService } from "../../services/appointmentService.ts";
import type { GraphState } from "../graph.ts";

const CreateCancellerSchema = z.object({
	professionalId: z.number({ required_error: "Profissional nao informado" }),
	datetime: z.string({ required_error: "Data é obrigatória" }),
	patientName: z.string({ required_error: "Paciente é obrigatório" }),
});

export function createCancellerNode(appointmentService: AppointmentService) {
	return async (state: GraphState): Promise<Partial<GraphState>> => {
		console.log(`❌ Cancelling appointment...`);

		try {
			const validation = CreateCancellerSchema.safeParse(state);

			if (!validation.success) {
				const errorMessages = validation.error.errors
					.map((error) => error.message)
					.join(", ");

				console.log(`Validação falhou:  ${errorMessages}`);

				return {
					actionSuccess: false,
					actionError: errorMessages,
				};
			}

			appointmentService.cancelAppointment(
				validation.data.professionalId,
				validation.data.patientName,
				new Date(validation.data.datetime),
			);

			return {
				actionSuccess: true,
			};
		} catch (error) {
			console.log(
				`❌ Cancellation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			return {
				...state,
				actionSuccess: false,
				actionError:
					error instanceof Error ? error.message : "Cancellation failed",
			};
		}
	};
}
