import Turnos from "../models/turnos.model.js";

class TurnosRepository {
    static async create(new_data) {
        return await Turnos.create(new_data);
    }

    static async getRecordatorio(limiteAviso, limiteEliminacion) {
        return await Turnos.find({
            estado: "pendiente",
            intentosRecordatorio: 0,
            fecha: { $lte: limiteAviso, $gt: limiteEliminacion },
        }).populate("cliente", "-password");
    }

    static async findTurnos(profesionalId, fecha, hora) {
        return await Turnos.findOne({
            profesional: profesionalId,
            fecha: fecha,
            hora: hora,
            estado: { $ne: "cancelado" },
        });
    }

    static async findTurnosByCliente(cliente) {
        return await Turnos.findOne({ cliente: cliente });
    }

    static async updateTurno(id_turno, new_data) {
        return await Turnos.findOneAndUpdate(id_turno, new_data);
    }

    static async verifyTurno(id_turno) {
        return await Turnos.findByIdAndUpdate(
            id_turno,
            { estado: "confirmado" },
            { new: true }
        )
            .populate("cliente", "-password")
            .populate("profesional", "-password");
    }

    static async deleteTurno(id_turno) {
        return await Turnos.findByIdAndDelete(id_turno);
    }

    static async getTurnoLimite(limiteEliminacion) {
        return await Turnos.find({
            estado: "pendiente",
            fecha: { $lte: limiteEliminacion },
        }).populate("cliente", "-password");
    }
}

export default TurnosRepository;
