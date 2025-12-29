import Ausencia from "../models/ausencia.model.js";

class AusenciaRepository {
    static async create(new_data) {
        return await Ausencia.create(new_data);
    }

    static async getAusencia(profesional, fecha) {
        return await Ausencia.findOne(
            { profesional: profesional },
            { fecha: fecha }
        );
    }
}

export default AusenciaRepository;
