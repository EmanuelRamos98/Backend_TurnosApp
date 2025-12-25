import Turnos from "../models/turnos.model.js";

class TurnosRepository {
    static async create(new_data) {
        return await Turnos.create(new_data);
    }

    static async findTurnos() {
        return await Turnos.find({});
    }

    static async findTurnosByProfesional(profesional) {
        return await Turnos.findOne({ profesional: profesional });
    }

    static async findTurnosByCliente(cliente) {
        return await Turnos.findOne({ cliente: cliente });
    }

    static async updateTurno(id_turno, new_data) {
        return await Turnos.findOneAndUpdate(id_turno, new_data);
    }

    static async deleteTurno(id_turno) {
        return await Turnos.findByIdAndDelete(id_turno);
    }
}

export default TurnosRepository;
