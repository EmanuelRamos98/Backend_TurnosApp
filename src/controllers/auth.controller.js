import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import AppError from '../helpers/error.helpers.js';
import { validaInput } from '../helpers/inputs.helpers.js';
import UsuarioRepository from '../repositories/usuario.repository.js';
import ApiResponse from '../helpers/api.response.js';
import ENVIROMENT from '../config/enviroment.config.js';
import EmailService from '../services/email.services.js';
import { generarCodigo } from '../utils/codigo.utils.js';

export const identificarController = async (req, res, next) => {
    try {
        const { email } = req.body;

        const usuario = await UsuarioRepository.findByEmail(email);
        if (!usuario) {
            return res.status(200).json(new ApiResponse(200, 'Usuario no existe', { existe: false }));
        }

        if (!usuario.hasSetPassword) {
            const codigo = generarCodigo();

            usuario.verificationCode = codigo;
            usuario.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
            await usuario.save();

            await EmailService.sendRestauracionPassword(usuario.email, usuario.nombre, codigo);
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

export const solicitarClaveController = async (req, res, next) => {
    try {
        const { email, token, password } = req.body;
        const usuario = await UsuarioRepository.findByEmail(email);
        if (!usuario) {
            return next(new AppError('Usuario no encontrado', 404));
        }

        if (
            !usuario.verificationCode ||
            usuario.verificationCode !== token ||
            usuario.verificationCodeExpires < Date.now()
        ) {
            return res.status(400).json(new ApiResponse(400, 'El codigo es incorrecto o ha expirado'));
        }
        const hashPassword = await bcrypt.hash(password, 10);
        usuario.password = hashPassword;
        usuario.hasSetPassword = true;

        usuario.verificationCode = null;
        usuario.verificationCodeExpires = null;
        await usuario.save();

        const jwtToken = jwt.sign(
            {
                id: usuario._id,
                nombre: usuario.nombre,
                rol: usuario.rol,
            },
            ENVIROMENT.SECRET_KEY,
            { expiresIn: '1d' }
        );

        return res.status(200).json(new ApiResponse(200, 'Cuenta activada con exito', { acces_token: jwtToken }));
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
                apellido: user.apellido,
                email: user.email,
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

export const solicitarRecuperacionController = async (req, res, next) => {
    try {
        const { email } = req.body;

        const usuario = await UsuarioRepository.findByEmail(email);
        if (!usuario) {
            return next(new AppError('No hay usuarios registrados con este correo', 400));
        }

        const codigo = generarCodigo();
        usuario.verificationCode = codigo;
        usuario.verificationCodeExpires = Date.now() + 15 * 60 * 100;
        await usuario.save();

        await EmailService.sendRestauracionPassword(usuario.email, usuario.nombre, codigo);
        return res.status(200).json(new ApiResponse(200, 'Codigo enviado con exito', { email: usuario.email }));
    } catch (error) {
        next(error);
    }
};

export const restaurarPasswordController = async (req, res, next) => {
    try {
        const { email, token, password } = req.body;

        const schema = { password: { type: 'string', required: true, min: 8, max: 20 } };
        const errores = validaInput(req.body, schema);
        if (errores.length > 0) {
            return next(new AppError('Errores de validacion', 400, errores));
        }

        const usuario = await UsuarioRepository.findByEmail(email);
        if (!usuario) {
            return next(new AppError('Usuario no existente', 400));
        }

        if (
            !usuario.verificationCode ||
            usuario.verificationCode !== token ||
            usuario.verificationCodeExpires < Date.now()
        ) {
            return res.status(400).json(new ApiResponse(400, 'El código es incorrecto o ha expirado'));
        }

        const passwordHash = await bcrypt.hash(password, 10);
        usuario.password = passwordHash;
        usuario.hasSetPassword = true;

        usuario.verificationCode = null;
        usuario.verificationCodeExpires = null;
        await usuario.save();

        return res.status(200).json(new ApiResponse(200, 'Contraseña restablecida correctamente', {}));
    } catch (error) {
        next(error);
    }
};

export const registerController = async (req, res, next) => {
    try {
        const { nombre, apellido, password, email, rol } = req.body;

        const schema = {
            nombre: { type: 'string', required: true, min: 1, max: 20 },
            apellido: { type: 'string', required: true, min: 1, max: 20 },
            password: { type: 'string', required: true, min: 8, max: 20 },
            email: { type: 'email', required: true },
            rol: { type: 'string', min: 1, max: 14 },
        };

        const errores = validaInput(req.body, schema);
        if (errores.length > 0) {
            return next(new AppError('Errores de validacion', 400, errores));
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const new_user = {
            nombre,
            apellido,
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
