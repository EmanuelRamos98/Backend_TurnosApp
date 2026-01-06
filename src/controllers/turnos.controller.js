import jwt from "jsonwebtoken";
import ApiResponse from "../helpers/api.response.js";
import AppError from "../helpers/error.helpers.js";
import { validaInput } from "../helpers/inputs.helpers.js";
import AusenciaRepository from "../repositories/ausencia.repository.js";
import DisponibilidadRepository from "../repositories/disponibilidad.repository.js";
import TurnosRepository from "../repositories/turno.repository.js";
import UsuarioRepository from "../repositories/usuario.repository.js";
import ENVIROMENT from "../config/enviroment.config.js";
import EmailService from "../services/email.services.js";

export const getTurnoByProfesional = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
};

export const getTurnoByCliente = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
};

export const getTurnos = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
};

export const createTurno = async (req, res, next) => {
    try {
        const { datos_cliente, profesional, fecha, hora } = req.body;

        const schemaTurno = {
            profesional: { type: "string", required: true, min: 24, max: 24 },
            fecha: { type: "string", required: true },
            hora: { type: "time", required: true },
        };

        const schemaCliente = {
            nombre: { type: "string", required: true, min: 2, max: 50 },
            apellido: { type: "string", required: true, min: 2, max: 50 },
            email: { type: "email", required: true },
            dni: {
                type: "number",
                required: true,
                min: 10000000,
                max: 99999999,
            },
            telefono: { type: "number", required: true, min: 1000000000 },
        };

        const errorTurno = validaInput(req.body, schemaTurno);
        let errorCliente = [];
        if (!datos_cliente) {
            errorCliente.push({
                field: "datos_cliente",
                message: "Faltan los datos del cliente",
            });
        } else {
            errorCliente = validaInput(datos_cliente, schemaCliente);
        }

        const totalErrores = [...errorTurno, ...errorCliente];
        if (totalErrores.length > 0) {
            return next(new AppError("Datos invalidos", 400, totalErrores));
        }

        let clienteId;

        const clienteExistente = await UsuarioRepository.buscarCliente(
            datos_cliente.email,
            datos_cliente.dni
        );

        if (clienteExistente) {
            clienteId = clienteExistente._id;
        } else {
            const nuevoUsuario = await UsuarioRepository.create({
                nombre: datos_cliente.nombre,
                apellido: datos_cliente.apellido,
                email: datos_cliente.email,
                din: datos_cliente.dni,
                telefono: datos_cliente.telefono,
                password: Math.random().toString(36).slice(-10),
                rol: "cliente",
                verficado: false,
            });
            clienteId = nuevoUsuario._id;
        }

        const fechaCompleta = new Date(`${fecha}T${hora}:00`);

        if (isNaN(fechaCompleta.getTime())) {
            return next(new AppError("Formato fecha invalido", 400));
        }

        const diaSemana = fechaCompleta.getDay();

        const trabajaNormalmente =
            await DisponibilidadRepository.verificarRegla(
                profesional,
                diaSemana,
                hora
            );

        if (!trabajaNormalmente) {
            return next(
                new AppError(
                    "El profesional no esta disponible en ese horario",
                    400
                )
            );
        }

        const tieneAusencia = await AusenciaRepository.getAusencia(
            profesional,
            fecha
        );
        if (tieneAusencia) {
            return next(
                new AppError(
                    `El profesional no esta disponible en esa fecha. Motivo: ${tieneAusencia.motivo}`,
                    400
                )
            );
        }

        const turnoOcupado = await TurnosRepository.findTurnos(
            profesional,
            fecha,
            hora
        );
        if (turnoOcupado) {
            return next(
                new AppError("El turno ya esta ocupado por otra persona", 400)
            );
        }

        const new_data = {
            cliente: clienteId,
            profesional,
            fecha: fechaCompleta,
            hora,
            estado: "pendiente",
        };
        const nuevoTurno = await TurnosRepository.create(new_data);

        const TOKEN = jwt.sign(
            { turnoId: nuevoTurno._id },
            ENVIROMENT.SECRET_KEY,
            { expiresIn: "1h" }
        );

        await EmailService.sendSolicitudVerificacion(
            datos_cliente.email,
            datos_cliente.nombre,
            fecha,
            hora,
            TOKEN
        );
        return res.status(200).json(
            new ApiResponse(201, "Turno creado exitosamente", {
                turno: nuevoTurno,
                nuevoUsuario: !clienteExistente,
            })
        );
    } catch (error) {
        if (error.code === 11000) {
            return next(
                new AppError(
                    "El turno ya está ocupado (Concurrency Error)",
                    409
                )
            );
        }
        next(error);
    }
};

export const verifyTurno = async (req, res, next) => {
    try {
        const { token } = req.params;
        const decode = jwt.verify(token, ENVIROMENT.SECRET_KEY);

        const turno = await TurnosRepository.verifyTurno(decode.turnoId);

        if (!turno) {
            return res.status(404).send("<h1>Error: El turno no existe.</h1>");
        }
        if (turno.cliente && turno.cliente.email) {
            const fechaFormateada = new Date(turno.fecha).toLocaleDateString(
                "es-AR"
            );
            await EmailService.sendTurnoConfirmado(
                turno.cliente.email,
                turno.cliente.nombre,
                fechaFormateada,
                turno.hora,
                turno.profesional.nombre
            );
        }

        res.status(200).send(`
            <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
                <h1 style="color: green;">¡Turno Confirmado! ✅</h1>
                <p>Hola <b>${
                    turno.cliente.nombre
                }</b>, tu turno ha sido agendado exitosamente.</p>
                <p>Te esperamos el día <b>${new Date(
                    turno.fecha
                ).toLocaleDateString()}</b> a las <b>${turno.hora}</b>.</p>
                <p>Hemos enviado un comprobante a ${turno.cliente.email}.</p>
            </div>
        `);
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res
                .status(400)
                .send("<h1>Error: El enlace ha expirado o no es válido.</h1>");
        }
        next();
    }
};

export const updateTurno = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
};

export const deleteTurno = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
};
