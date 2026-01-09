import ApiResponse from '../helpers/api.response.js';
import AppError from '../helpers/error.helpers.js';
import { validaInput } from '../helpers/inputs.helpers.js';
import UsuarioRepository from '../repositories/usuario.repository.js';

export const buscarClienteController = async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(200).json(new ApiResponse(200, 'Sin criterios de busqueda', []));
        }

        const cliente = await UsuarioRepository.buscarClienteRegex(query);
        return res.status(200).json(new ApiResponse(200, 'Cliente', cliente));
    } catch (error) {
        next(error);
    }
};

export const getAllClietnesController = async (req, res, next) => {
    try {
        const clientes = await UsuarioRepository.findAll({ rol: 'cliente' });
        res.status(200).json(new ApiResponse(200, 'Clietnes: ', clientes));
    } catch (error) {
        next(error);
    }
};

export const getClietnteByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;

        const cliente = await UsuarioRepository.findById(id);

        if (!cliente) {
            return next(new AppError('Cliente no encontrado', 404));
        }

        return res.status(200).json(new ApiResponse(200, 'Cliente: ', cliente));
    } catch (error) {
        next(error);
    }
};

export const updateClienteController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, dni, telefono, email } = req.body;

        const datosAEditar = {};
        if (nombre) datosAEditar.nombre = nombre;
        if (apellido) datosAEditar.apellido = apellido;
        if (dni) datosAEditar.dni = dni;
        if (telefono) datosAEditar.telefono = telefono;
        if (email) datosAEditar.email = email;

        if (Object.keys(datosAEditar).length === 0) {
            return next(new AppError('No hay datos para actualizar', 400));
        }

        const schema = {
            nombre: { type: 'string', min: 2, max: 50, optional: true },
            apellido: { type: 'string', min: 2, max: 50, optional: true },
            telefono: { type: 'number', min: 1000000000, optional: true },
            dni: { type: 'number', min: 1000000, optional: true },
            email: { type: 'email', optional: true },
        };

        const erroresValidacion = validaInput(datosAEditar, schema);
        if (erroresValidacion.length > 0) {
            return next(new AppError('Errores de validacion', 400, erroresValidacion));
        }

        const clienteActualizado = await UsuarioRepository.update(id, datosAEditar);
        if (!clienteActualizado) {
            return next(new AppError('Cliente no encontrado', 404));
        }

        return res.status(200).json(new ApiResponse(200, 'Cliente actualizado: ', clienteActualizado));
    } catch (error) {
        next(error);
    }
};

export const deleteClienteController = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await UsuarioRepository.delete(id);
        if (!eliminado) {
            return next(new AppError('Cliente no encontrado', 404));
        }

        return res.status(200).json(new ApiResponse(200, 'Eliminado: ', eliminado));
    } catch (error) {
        next(error);
    }
};
