import Usuario from '../models/usuario.model.js';

class UsuarioRepository {
    static async create(new_user) {
        return await Usuario.create(new_user);
    }

    static async findByEmail(email) {
        return await Usuario.findOne({ email: email });
    }

    static async findByTokenRestauracion(token) {
        return await Usuario.findOne({ tokenRestauracion: token });
    }

    static async getByName(nombre) {
        return await Usuario.findOne({ nombre: nombre }).select('+password');
    }

    static async buscarCliente(email, dni) {
        return await Usuario.findOne({
            $or: [{ email: email }, { dni: dni }],
        });
    }

    static async buscarClienteRegex(termino) {
        const regex = new RegExp(termino, 'i');

        const esNumero = !isNaN(termino) && termino.trim() !== '';
        return await Usuario.find({
            rol: 'cliente',
            $or: [
                { nombre: regex },
                { apellido: regex },
                { email: regex },
                { dni: esNumero ? Number(termino) : null },
            ].filter(Boolean),
        }).select('nombre apellido email dni _id');
    }

    static async findById(id) {
        return await Usuario.findById(id).select('nombre apellido email dni');
    }

    static async findAll(filtro = {}) {
        return await Usuario.find(filtro).select('nombre apellido email dni _id');
    }

    static async update(id, data) {
        return await Usuario.findByIdAndUpdate(id, data, { new: true }).select('nombre apellido email dni _id');
    }

    static async delete(id) {
        return await Usuario.findByIdAndDelete(id);
    }

    static async getAllProfesionales() {
        return await Usuario.find({ rol: 'profesional' }).select('nombre apellido email _id').lean();
    }
}

export default UsuarioRepository;
