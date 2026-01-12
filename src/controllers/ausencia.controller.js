import ApiResponse from '../helpers/api.response.js';
import AppError from '../helpers/error.helpers.js';
import { validaInput } from '../helpers/inputs.helpers.js';
import AusenciaRepository from '../repositories/ausencia.repository.js';

export const createAusencia = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin, motivo, nota, profesional: profesionalBody } = req.body;
        const schema = {
            fechaInicio: { required: true, type: 'string', min: 10 },
            fechaFin: { required: true, type: 'string', min: 10 },
            motivo: { required: true, type: 'string' },
        };

        const errores = validaInput(req.body, schema);
        if (errores.length > 0) {
            return next(new AppError('Errores de validacion', 400, errores));
        }

        let profesionalId;

        if (req.user.rol === 'admin') {
            if (!profesionalBody) {
                return next(
                    new AppError(
                        'Como administrador, debes especificar el ID del profesional (campo "profesional")',
                        400
                    )
                );
            }
            profesionalId = profesionalBody;
        } else {
            profesionalId = req.user.id;
        }

        const [anioI, mesI, diaI] = fechaInicio.split('-');
        const [anioF, mesF, diaF] = fechaFin.split('-');

        const inicio = new Date(anioI, mesI - 1, diaI);
        const fin = new Date(anioF, mesF - 1, diaF);

        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);

        if (inicio > fin) {
            return next(new AppError('La fecha de fin debe ser posterior a la de incio', 400));
        }

        const duplicados = await AusenciaRepository.findAusenciasEnRango(profesionalId, inicio, fin);
        if (duplicados.length > 0) {
            return next(new AppError('Ya existe ausencia registrada en ese rango de fechas', 409));
        }

        const nuevaAusencia = await AusenciaRepository.create({
            profesional: profesionalId,
            fechaInicio: inicio,
            fechaFin: fin,
            motivo,
            nota,
        });

        return res.status(200).json(new ApiResponse(200, 'Ausencia registrada correctamente', nuevaAusencia));
    } catch (error) {
        next(error);
    }
};

export const getAusencia = async (req, res, next) => {
    try {
        const { profesionalId } = req.params;
        const usuarioLogeado = req.user;

        if (usuarioLogeado.rol !== 'admin') {
            if (usuarioLogeado.id !== profesionalId) {
                return next(new AppError('No tienes permisno para ver las ausencias de otro profesional', 403));
            }
        }

        const ausencias = await AusenciaRepository.findAllByProfesional(profesionalId);
        return res.status(200).json(new ApiResponse(200, 'Listado de ausencias', ausencias));
    } catch (error) {
        next(error);
    }
};

export const deleteAusencia = async (req, res, next) => {
    try {
        const { id } = req.params;
        const usuarioLogeado = req.user;

        const ausencia = await AusenciaRepository.findById(id);
        if (!ausencia) {
            return next(new AppError('Ausencia no encontrada', 400));
        }

        if (usuarioLogeado.rol !== 'admin' && ausencia.profesional.toString() !== usuarioLogeado.id) {
            return next(new AppError('No tienes permiso para eliminar esta ausencia', 403));
        }

        await AusenciaRepository.delete(id);
        return res.status(200).json(new ApiResponse(200, 'Ausencia eliminada'));
    } catch (error) {
        next(error);
    }
};
