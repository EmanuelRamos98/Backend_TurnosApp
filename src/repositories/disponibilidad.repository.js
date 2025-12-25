import Disponibilidad from "../models/disponibilidad.model.js";

class DisponibilidadRepository {
    static async create(new_data) {
        return await Disponibilidad.create(new_data);
    }

    static async verificarSolapamiento(
        profesional_id,
        dia,
        nuevoInicio,
        nuevoFin
    ) {
        const conflicto = await Disponibilidad.findOne({
            profesional: profesional_id,
            diaSemana: dia,
            $and: [
                { horaInicio: { $lt: nuevoFin } }, // El turno existente empieza antes de que el nuevo termine
                { horaFin: { $gt: nuevoInicio } }, // El turno existente termina después de que el nuevo empiece
            ],
        });
        return conflicto;
    }

    static async getDisponibilidad(profesional_id) {
        return await Disponibilidad.find({ profesional: profesional_id });
    }

    static async updateDisponibilidad(profesional, new_data) {
        return await Disponibilidad.findOneAndUpdate(profesional, new_data);
    }

    static async deleteDisponibilidad(id_diponibilidad) {
        return await Disponibilidad.findByIdAndDelete(id_diponibilidad);
    }
}

export default DisponibilidadRepository;
