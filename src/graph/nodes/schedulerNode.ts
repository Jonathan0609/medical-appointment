import { z } from "zod/v3";
import type { AppointmentService } from "../../services/appointmentService.ts";
import type { GraphState } from "../graph.ts";

const CreateScheduleSchema = z.object({
	professionalId: z.number({ required_error: "Profissional nao informado" }),
	datetime: z.string({ required_error: "Data é obrigatória" }),
	patientName: z.string({ required_error: "Paciente é obrigatório" }),
});

export function createSchedulerNode(appointmentService: AppointmentService) {
	return async (state: GraphState): Promise<Partial<GraphState>> => {
		console.log(`📅 Scheduling appointment...`);

		try {
			const validation = CreateScheduleSchema.safeParse(state);

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

			const appointment = appointmentService.bookAppointment(
				validation.data.professionalId,
				new Date(validation.data.datetime),
				validation.data.patientName,
				state.reason ?? "Consulta geral",
			);

			return {
				actionSuccess: true,
				appointmentData: appointment,
			};
		} catch (error) {
			console.log(
				`❌ Scheduling failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			return {
				...state,
				actionSuccess: false,
				actionError:
					error instanceof Error ? error.message : "Scheduling failed",
			};
		}
	};
}
