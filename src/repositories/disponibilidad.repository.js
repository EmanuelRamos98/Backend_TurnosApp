import Disponibilidad from '../models/disponibilidad.model.js';

class DisponibilidadRepository {
    static async create(new_data) {
        return await Disponibilidad.create(new_data);
    }

    static async verificarSolapamiento(profesional_id, dia, nuevoInicio, nuevoFin, excludeId = null) {
        const query = {
            profesional: profesional_id,
            diaSemana: dia,
            $and: [
                { horaInicio: { $lt: nuevoFin } }, // El turno existente empieza antes de que el nuevo termine
                { horaFin: { $gt: nuevoInicio } }, // El turno existente termina después de que el nuevo empiece
            ],
        };

        if (excludeId) {
            query._id = { $ne: excludeId }; // $ne = Not Equal (No igual a)
        }
        const conflicto = await Disponibilidad.findOne(query);
        return conflicto;
    }

    static async verificarRegla(profesionalId, diaSemana, horaTurno) {
        return await Disponibilidad.findOne({
            profesional: profesionalId,
            diaSemana: diaSemana,
            horaInicio: { $lte: horaTurno },
            horaFin: { $gt: horaTurno },
        });
    }

    static async getDisponibilidad(profesional_id) {
        return await Disponibilidad.find({ profesional: profesional_id }).sort({
            diaSemana: 1,
            horaInicio: 1,
        });
    }

    static async getDisponibilidadById(id) {
        return await Disponibilidad.findById(id);
    }

    static async updateDisponibilidad(id, new_data) {
        return await Disponibilidad.findOneAndUpdate({ _id: id }, new_data, {
            new: true,
        });
    }

    static async deleteDisponibilidad(id) {
        return await Disponibilidad.findByIdAndDelete(id);
    }
}

export default DisponibilidadRepository;
