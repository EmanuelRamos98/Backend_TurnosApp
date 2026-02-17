import ApiResponse from '../helpers/api.response.js';
import AppError from '../helpers/error.helpers.js';
import UsuarioRepository from '../repositories/usuario.repository.js';

export const getProfesionales = async (req, res, next) => {
    try {
        const profesionales = await UsuarioRepository.getAllProfesionales();
        if (!profesionales || profesionales.length === 0) {
            return next(new AppError('No se encuentrar profesionales registrados', 400));
        }

        return res.status(200).json(new ApiResponse(200, 'Listado de profesionales', profesionales));
    } catch (error) {
        next(error);
    }
};
