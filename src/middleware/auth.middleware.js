import AppError from '../helpers/error.helpers.js';
import jwt from 'jsonwebtoken';
import ENVIROMENT from '../config/enviroment.config.js';
import UsuarioRepository from '../repositories/usuario.repository.js';

const authMiddleware = (rolesPermitidos) => {
    return async (req, res, next) => {
        try {
            const auth_header = req.headers['authorization'];
            if (!auth_header) {
                return next(new AppError('Falta TOKEN de autorizacion'), 401);
            }

            const token = auth_header.split(' ')[1];

            if (!token) {
                return next(new AppError('El TOKEN de autorizacion no tiene el formato correcto'), 401);
            }

            const decoded = jwt.verify(token, ENVIROMENT.SECRET_KEY);
            if (!decoded) {
                return next(new AppError('Error de decodificacion de TOKEN'), 404);
            }
            req.user = decoded;

            const usuarioReal = await UsuarioRepository.findById(decoded.id);
            if (!usuarioReal) {
                return next(new AppError('El usuario de este token ya no existe', 401));
            }

            if (Array.isArray(rolesPermitidos) && rolesPermitidos.length > 0) {
                if (!rolesPermitidos.includes(decoded.rol)) {
                    return next(new AppError('Acceso denegado: ROL INSUFICIENTE', 403));
                }
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
export default authMiddleware;
