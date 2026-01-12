import Ausencia from '../models/ausencia.model.js';

class AusenciaRepository {
    static async create(new_data) {
        return await Ausencia.create(new_data);
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

    static async findById(id) {
        return await Ausencia.findById(id);
    }

    static async findAllByProfesional(profesionalId) {
        return await Ausencia.find({ profesional: profesionalId }).sort({ fechaInicio: 1 });
    }

    static async delete(id) {
        return await Ausencia.findByIdAndDelete(id);
    }
}

export default AusenciaRepository;
