import Ausencia from '../models/ausencia.model.js';

class AusenciaRepository {
    static async create(new_data) {
        return await Ausencia.create(new_data);
    }

    static async getAusencia(profesional, fecha) {
        return await Ausencia.findOne({ profesional: profesional }, { fecha: fecha });
    }

    static async findAusenciasEnRango(profesionalId, fechaInicio, fechaFin) {
        return await Ausencia.find({
            profesional: profesionalId,
            $or: [
                { fechaInicio: { $gte: fechaInicio, $lte: fechaFin } },
                { fechaFin: { $gte: fechaInicio, $lte: fechaFin } },
                { fechaInicio: { $lt: fechaInicio }, fechaFin: { $gt: fechaFin } },
            ],
        });
    }
}

export default AusenciaRepository;
