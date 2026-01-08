import Usuario from '../models/usuario.model.js';

class UsuarioRepository {
    static async create(new_user) {
        return await Usuario.create(new_user);
    }

    static async getByName(nombre) {
        return await Usuario.findOne({ nombre: nombre }).select('+password');
    }

    static async buscarCliente(email, dni) {
        return await Usuario.findOne({
            $or: [{ email: email }, { dni: dni }],
        });
    }

    static async findById(id) {
        return await Usuario.findOne({ _id: id });
    }

    static async getProfesional(profesional_id) {
        return await Usuario.findById(profesional_id);
    }
}

export default UsuarioRepository;
