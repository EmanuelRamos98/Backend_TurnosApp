import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import AppError from '../helpers/error.helpers.js';
import { validaInput } from '../helpers/inputs.helpers.js';
import UsuarioRepository from '../repositories/usuario.repository.js';
import ApiResponse from '../helpers/api.response.js';
import ENVIROMENT from '../config/enviroment.config.js';
import EmailService from '../services/email.services.js';

export const identificarController = async (req, res, next) => {
    try {
        const { email } = req.body;

        const usuario = await UsuarioRepository.findByEmail(email);
        if (!usuario) {
            return res.status(200).json(new ApiResponse(200, 'Usuario no existe', { existe: false }));
        }

        return res.status(200).json(
            new ApiResponse(200, 'Usuario si existe', {
                existe: true,
                nombre: usuario.nombre,
                hasSetPassword: usuario.hasSetPassword,
            })
        );
    } catch (error) {
        next(error);
    }
};

export const loginController = async (req, res, next) => {
    try {
        const { nombre, password } = req.body;

        const schema = {
            nombre: { type: 'string', required: true, min: 1, max: 20 },
            password: { type: 'string', required: true, min: 8, max: 20 },
        };

        const errores = validaInput(req.body, schema);
        if (errores.length > 0) {
            return next(new AppError('Errores de validacion', 400, errores));
        }

        const user = await UsuarioRepository.getByName(nombre);
        if (!user) {
            return next(new AppError('El usuario no existe', 401));
        }

        const passwordMach = await bcrypt.compare(password, user.password);
        if (!passwordMach) {
            return next(new AppError('Contraseña incorrecta', 401));
        }

        const TOKEN = jwt.sign(
            {
                id: user._id,
                nombre: user.nombre,
                rol: user.rol,
            },
            ENVIROMENT.SECRET_KEY,
            { expiresIn: '1d' }
        );

        return res.status(200).json(
            new ApiResponse(200, 'Login Sussces', {
                nombre: user.nombre,
                rol: user.rol,
                acces_token: TOKEN,
            })
        );
    } catch (error) {
        next(error);
    }
};

export const solicitarClaveController = async (req, res, next) => {
    try {
        const { email } = req.body;

        const usuario = await UsuarioRepository.findByEmail(email);
        if (!usuario) {
            return res.status(200).json(new ApiResponse(200, 'Usuario no existe', { existe: false }));
        }

        const token = crypto.randomBytes(32).toString('hex');
        usuario.tokenRestauracion = token;
        await usuario.save();

        const linkFrontend = `http://localhost:9090/crear-clave/${token}`;
        await EmailService.sendRestauracionPassword(email, usuario.nombre, linkFrontend);

        res.status(200).json(new ApiResponse(200, 'Correo enviado. Revisa tu bandeja de entrada.'));
    } catch (error) {
        next(error);
    }
};

export const restaurarClaveController = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const schema = { password: { type: 'string', required: true, min: 8, max: 20 } };
        const errores = validaInput(req.body, schema);
        if (errores.length > 0) {
            return next(new AppError('Errores de validacion', 400, errores));
        }

        const usuario = await UsuarioRepository.findByTokenRestauracion(token);
        if (!usuario) {
            return next(new AppError('Usuario no existente o token expirado', 400));
        }

        const passwordHash = await bcrypt.hash(password, 10);
        usuario.password = passwordHash;
        usuario.tokenRestauracion = null;
        usuario.hasSetPassword = true;
        await usuario.save();

        res.status(200).json(new ApiResponse(200, 'Contraseña actualizada correctamente. Ya puedes loguearte.'));
    } catch (error) {
        next(error);
    }
};

export const registerController = async (req, res, next) => {
    try {
        const { nombre, email, password, rol } = req.body;

        const schema = {
            nombre: { type: 'string', required: true, min: 1, max: 20 },
            email: { type: 'email', required: true },
            password: { type: 'string', required: true, min: 8, max: 20 },
            rol: { type: 'string', min: 1, max: 14 },
        };

        const errores = validaInput(req.body, schema);
        if (errores.length > 0) {
            return next(new AppError('Errores de validacion', 400, errores));
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const new_user = {
            nombre,
            email,
            rol,
            password: passwordHash,
        };

        const createUsuario = await UsuarioRepository.create(new_user);

        return res.status(201).json(new ApiResponse(201, 'Registro exitoso', createUsuario));
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError('Usuario ya existente', 400));
        }
        next(error);
    }
};
