import Turnos from '../models/turnos.model.js';

class TurnosRepository {
    //---------PETICIONES PARA EMAILS---------------------------//
    static async getRecordatorio(limiteAviso, limiteEliminacion) {
        return await Turnos.find({
            estado: 'pendiente',
            intentosRecordatorio: 0,
            fecha: { $lte: limiteAviso, $gt: limiteEliminacion },
        }).populate('cliente', 'email nombre');
    }

    static async getTurnoLimite(limiteEliminacion) {
        return await Turnos.find({
            estado: 'pendiente',
            fecha: { $lte: limiteEliminacion },
        }).populate('cliente', 'email nombre');
    }

    static async getTurnosPorFecha(inicio, fin) {
        return await Turnos.find({
            fecha: { $gte: inicio, $lte: fin },
            estado: 'confirmado',
        })
            .populate('profesional', 'nombre email')
            .populate('cliente', 'nombre apellido telefono email')
            .sort({ fecha: 1 });
    }
    //-----------------------------------------------------//
    static async create(new_data) {
        return await Turnos.create(new_data);
    }

    static async findById(id) {
        return await Turnos.findById(id).populate('cliente', 'email nombre').populate('profesional', 'email nombre');
    }

    static async findAll(filtros = {}) {
        return await Turnos.find(filtros)
            .populate('cliente', 'nombre apellido email dni')
            .populate('profesional', 'nombre apellido email')
            .sort({ fecha: 1, hora: 1 });
    }

    static async findTurnos(profesionalId, fecha, hora) {
        return await Turnos.findOne({
            profesional: profesionalId,
            fecha: fecha,
            hora: hora,
            estado: { $in: ['pendiente', 'confirmado'] },
        });
    }

    static async findTurnosByCliente(clienteId) {
        return await Turnos.find({ cliente: clienteId })
            .populate('profesional', 'nombre apellido email')
            .sort({ fecha: 1, hora: 1 });
    }

    static async findTurnosByProfesional(profesionalId, fecha = null) {
        const filtros = { profesional: profesionalId };

        if (fecha) {
            const inicio = new Date(fecha + 'T00:00:00');
            const fin = new Date(fecha + 'T23:59:59');
            filtros.fecha = { $gte: inicio, $lte: fin };
        } else {
            //mostrar solo los pendientes desde hoy en adelante
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            filtros.fecha = { $gte: hoy };
        }

        return await Turnos.find(filtros)
            .populate('cliente', 'nombre apellido dni email telefono')
            .sort({ fecha: 1, hora: 1 });
    }

    static async updateTurno(id_turno, new_data) {
        return await Turnos.findByIdAndUpdate(id_turno, new_data);
    }

    static async verifyTurno(id_turno) {
        return await Turnos.findByIdAndUpdate(id_turno, { estado: 'confirmado' }, { new: true })
            .populate('cliente', 'email nombre')
            .populate('profesional', 'email nombre');
    }

    static async deleteTurno(id_turno) {
        return await Turnos.findByIdAndDelete(id_turno);
    }
}

export default TurnosRepository;
