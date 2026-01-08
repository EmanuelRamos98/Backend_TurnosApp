import jwt from 'jsonwebtoken';
import ApiResponse from '../helpers/api.response.js';
import AppError from '../helpers/error.helpers.js';
import { validaInput } from '../helpers/inputs.helpers.js';
import AusenciaRepository from '../repositories/ausencia.repository.js';
import DisponibilidadRepository from '../repositories/disponibilidad.repository.js';
import TurnosRepository from '../repositories/turno.repository.js';
import UsuarioRepository from '../repositories/usuario.repository.js';
import ENVIROMENT from '../config/enviroment.config.js';
import EmailService from '../services/email.services.js';

export const createTurno = async (req, res, next) => {
    try {
        const { datos_cliente, profesional, fecha, hora } = req.body;

        const schemaTurno = {
            profesional: { type: 'string', required: true, min: 24, max: 24 },
            fecha: { type: 'string', required: true },
            hora: { type: 'time', required: true },
        };

        const schemaCliente = {
            nombre: { type: 'string', required: true, min: 2, max: 50 },
            apellido: { type: 'string', required: true, min: 2, max: 50 },
            email: { type: 'email', required: true },
            dni: {
                type: 'number',
                required: true,
                min: 10000000,
                max: 99999999,
            },
            telefono: { type: 'number', required: true, min: 1000000000 },
        };

        const errorTurno = validaInput(req.body, schemaTurno);
        let errorCliente = [];
        if (!datos_cliente) {
            errorCliente.push({
                field: 'datos_cliente',
                message: 'Faltan los datos del cliente',
            });
        } else {
            errorCliente = validaInput(datos_cliente, schemaCliente);
        }

        const totalErrores = [...errorTurno, ...errorCliente];
        if (totalErrores.length > 0) {
            return next(new AppError('Datos invalidos', 400, totalErrores));
        }

        let clienteId;

        const clienteExistente = await UsuarioRepository.buscarCliente(datos_cliente.email, datos_cliente.dni);

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
                rol: 'cliente',
                verficado: false,
            });
            clienteId = nuevoUsuario._id;
        }

        const fechaCompleta = new Date(`${fecha}T${hora}:00`);

        if (isNaN(fechaCompleta.getTime())) {
            return next(new AppError('Formato fecha invalido', 400));
        }

        const diaSemana = fechaCompleta.getDay();

        const trabajaNormalmente = await DisponibilidadRepository.verificarRegla(profesional, diaSemana, hora);

        if (!trabajaNormalmente) {
            return next(new AppError('El profesional no esta disponible en ese horario', 400));
        }

        const tieneAusencia = await AusenciaRepository.getAusencia(profesional, fecha);
        if (tieneAusencia) {
            return next(
                new AppError(`El profesional no esta disponible en esa fecha. Motivo: ${tieneAusencia.motivo}`, 400)
            );
        }

        const turnoOcupado = await TurnosRepository.findTurnos(profesional, fecha, hora);
        if (turnoOcupado) {
            return next(new AppError('El turno ya esta ocupado por otra persona', 400));
        }

        const new_data = {
            cliente: clienteId,
            profesional,
            fecha: fechaCompleta,
            hora,
            estado: 'pendiente',
        };
        const nuevoTurno = await TurnosRepository.create(new_data);

        const TOKEN = jwt.sign({ turnoId: nuevoTurno._id }, ENVIROMENT.SECRET_KEY, { expiresIn: '1h' });

        await EmailService.sendSolicitudVerificacion(datos_cliente.email, datos_cliente.nombre, fecha, hora, TOKEN);
        return res.status(200).json(
            new ApiResponse(201, 'Turno creado exitosamente', {
                turno: nuevoTurno,
                nuevoUsuario: !clienteExistente,
            })
        );
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError('El turno ya está ocupado (Concurrency Error)', 409));
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
            return res.status(404).send('<h1>Error: El turno no existe.</h1>');
        }
        if (turno.cliente && turno.cliente.email) {
            const fechaFormateada = new Date(turno.fecha).toLocaleDateString('es-AR');
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
                <p>Hola <b>${turno.cliente.nombre}</b>, tu turno ha sido agendado exitosamente.</p>
                <p>Te esperamos el día <b>${new Date(turno.fecha).toLocaleDateString()}</b> a las <b>${
            turno.hora
        }</b>.</p>
                <p>Hemos enviado un comprobante a ${turno.cliente.email}.</p>
            </div>
        `);
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(400).send('<h1>Error: El enlace ha expirado o no es válido.</h1>');
        }
        next();
    }
};

export const getMisTurnosCliente = async (req, res, next) => {
    try {
        const { id } = req.user;
        const turnos = await TurnosRepository.findTurnosByCliente(id);
        if (turnos.length === 0) {
            return res.status(200).json(new ApiResponse(200, 'No tienes turnos registrados todavia', []));
        }
        return res.status(200).json(new ApiResponse(200, 'Turnos: ', turnos));
    } catch (error) {
        next(error);
    }
};

export const cancelarTurno = async (req, res, next) => {
    try {
        const { id } = req.params;
        const usuarioLogueado = req.user;

        const turno = await TurnosRepository.findById(id);
        if (!turno) {
            return next(new AppError('Turno no encontrado', 404));
        }

        // Solo puede cancelar el dueño del turno, el profesional asignado
        if (usuarioLogueado.rol === 'cliente' && turno.cliente._id.toString() !== usuarioLogueado.id) {
            return next(new AppError('No tienes permiso para cancelar este turno', 403));
        }

        if (usuarioLogueado.rol === 'profesional' && turno.profesional._id.toString() !== usuarioLogueado.id) {
            return next(new AppError('No puedes cancelar un turno que no es de tu agenda', 403));
        }

        if (turno.estado === 'finalizado' || turno.estado === 'cancelado') {
            return next(new AppError('No se puede cancelar un turno ya finalizado o cancelado', 400));
        }

        const turnoCancelado = await TurnosRepository.updateTurno(id, {
            estado: 'cancelado',
        });

        if (usuarioLogueado.rol === 'cliente') {
            await EmailService.sendAvisoCancelacion(
                turno.profesional.email,
                'Un cliente ha cancelado su turno',
                `El cliente ${turno.cliente.nombre} ha cancelado el turno del ${new Date(
                    turno.fecha
                ).toLocaleDateString()} a las ${turno.hora}`
            );
        } else if (usuarioLogueado.rol === 'profesional') {
            await EmailService.sendAvisoCancelacion(
                turno.cliente.email,
                'Tu turno ha sido cancelado',
                `El profesional ${turno.profesional.nombre} ha tenido que cancelar tu turno. Por favor reprograma.`
            );
        } else if (usuarioLogueado.rol === 'admin') {
            await EmailService.sendAvisoCancelacion(
                turno.cliente.email,
                'Turno cancelado por administración',
                `La administracion ha cancelado tu turno con ${turno.profesional.nombre}. Por favor reprograma o comunicate con nosotros.`
            );
        }

        return res.status(200).json(new ApiResponse(200, 'Turno cancelado exitosamente', turnoCancelado));
    } catch (error) {
        next(error);
    }
};

export const getMisTurnosProfesional = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { fecha } = req.query;

        const turnos = await TurnosRepository.findTurnosByProfesional(id, fecha);
        if (turnos.length === 0) {
            return res.status(200).json(new ApiResponse(200, 'Agenda vacia', []));
        }

        return res.status(200).json(new ApiResponse(200, 'Agenda obtenida', turnos));
    } catch (error) {
        next(error);
    }
};

export const marcarEstadoTurno = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const usuarioLogueado = req.user;

        const estadosPermitidos = ['ausente', 'finalizado'];

        if (!estadosPermitidos.includes(estado)) {
            return next(new AppError(`Estado invalido: Solo se permite: ${estadosPermitidos.join(' o ')}`, 400));
        }

        const turno = await TurnosRepository.findById(id);
        if (!turno) {
            return next(new AppError('Turno no encontrado', 404));
        }

        //Validacion solo admin o profesional
        const isAdmin = usuarioLogueado.rol === 'admin';
        const isProfesional = turno.profesional._id.toString() === usuarioLogueado.id;

        if (!isAdmin && !isProfesional) {
            return next(new AppError('No tienes permiso para gestionar este turno', 403));
        }

        if (['finalizado', 'ausente', 'cancelado'].includes(turno.estado)) {
            return next(new AppError('Este turno ya fue cerrado y no se puede volver a modificar', 400));
        }

        const turnoUpdate = await TurnosRepository.updateTurno(id, { estado: estado });
        return res.status(200).json(new ApiResponse(200, `Turno marcado como ${estado}`, turnoUpdate));
    } catch (error) {
        next(error);
    }
};

export const getAllTunos = async (req, res, next) => {
    try {
        const { fecha, profesional, cliente, estado } = req.query;

        const query = {};

        if (profesional) query.profesional = profesional;
        if (cliente) query.cliente = cliente;
        if (estado) query.estado = estado;

        if (fecha) {
            const inicioDia = new Date(`${fecha}T00:00:00`);
            const finDia = new Date(`${fecha}T23:59:59`);
            query.fecha = { $gte: inicioDia, $lte: finDia };
        }

        const turnos = await TurnosRepository.findAll(query);
        if (turnos.length === 0) {
            return res.status(200).json(new ApiResponse(200, 'No se encontraron turnos con estos filtros', []));
        }

        return res.status(200).json(new ApiResponse(200, 'Listado de turnos obtenidos', turnos));
    } catch (error) {
        next(error);
    }
};
