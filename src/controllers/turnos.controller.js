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
        const { profesionalId } = req.params;
        const { datos_cliente, fecha, hora, clienteId } = req.body;

        const usuarioLogueado = req.user || null;
        const isAdminOPro =
            usuarioLogueado && (usuarioLogueado.rol === 'admin' || usuarioLogueado.rol === 'profesional');

        const schemaTurno = {
            fecha: { type: 'string', required: true },
            hora: { type: 'time', required: true },
        };

        const errorTurno = validaInput(req.body, schemaTurno);
        if (errorTurno.length > 0) {
            return next(new AppError('Datos invalidos', 400, errorTurno));
        }

        let idFinalCliente;
        let nombreCliente;
        let emailCliente;
        let esNuevoUsuario = false;

        if (isAdminOPro && clienteId) {
            const cliente = await UsuarioRepository.findById(clienteId);
            if (!cliente) return next(new AppError('El cliente no existe', 404));

            idFinalCliente = cliente._id;
            nombreCliente = cliente.nombre;
            emailCliente = cliente.email;
        } else {
            if (!datos_cliente) return next(new AppError('Faltan los datos del cliente', 400));

            const schemaCliente = {
                nombre: { type: 'string', required: true, min: 2, max: 50 },
                apellido: { type: 'string', required: true, min: 2, max: 50 },
                email: { type: 'email', required: true },
                dni: { type: 'number', required: true, min: 10000000, max: 99999999 },
                telefono: { type: 'number', required: true, min: 1000000000 },
            };

            const errorCliente = validaInput(datos_cliente, schemaCliente);
            if (errorCliente.length > 0) return next(new AppError('Datos cel cliente invalidos', 400, errorCliente));

            const clienteExistente = await UsuarioRepository.buscarCliente(datos_cliente.email, datos_cliente.dni);
            if (clienteExistente) {
                idFinalCliente = clienteExistente._id;
                nombreCliente = clienteExistente.nombre;
                emailCliente = clienteExistente.email;
            } else {
                const nuevoUsuario = await UsuarioRepository.create({
                    nombre: datos_cliente.nombre,
                    apellido: datos_cliente.apellido,
                    email: datos_cliente.email,
                    dni: datos_cliente.dni,
                    telefono: datos_cliente.telefono,
                    password: Math.random().toString(36).slice(-10),
                    hasSetPassword: false,
                    rol: 'cliente',
                    verificado: false,
                });
                idFinalCliente = nuevoUsuario._id;
                nombreCliente = nuevoUsuario.nombre;
                emailCliente = nuevoUsuario.email;
                esNuevoUsuario = true;
            }
        }

        //En caso de ser creado por admin ya queda confirmado
        const estadoInicial = isAdminOPro ? 'confirmado' : 'pendiente';

        const fechaCompleta = new Date(`${fecha}T${hora}:00`);
        if (isNaN(fechaCompleta.getTime())) return next(new AppError('Formato fecha invalido', 400));

        const diaSemana = fechaCompleta.getDay();

        const trabajaNormalmente = await DisponibilidadRepository.verificarRegla(profesionalId, diaSemana, hora);
        if (!trabajaNormalmente) return next(new AppError('El profesional no esta disponible en ese horario', 400));

        const ausenciasConflicto = await AusenciaRepository.findAusenciasEnRango(
            profesionalId,
            fechaCompleta,
            fechaCompleta
        );

        if (ausenciasConflicto.length > 0) {
            const motivo = ausenciasConflicto[0].motivo;
            return next(new AppError(`El profesional no está disponible en esa fecha. Motivo: ${motivo}`, 400));
        }

        const turnoOcupado = await TurnosRepository.findTurnos(profesionalId, fecha, hora);
        if (turnoOcupado) return next(new AppError('El turno ya esta ocupado por otra persona', 400));

        const new_data = {
            cliente: idFinalCliente,
            profesional: profesionalId,
            fecha: fechaCompleta,
            hora,
            estado: estadoInicial,
        };

        const nuevoTurno = await TurnosRepository.create(new_data);

        if (estadoInicial === 'pendiente') {
            const TOKEN = jwt.sign({ turnoId: nuevoTurno._id }, ENVIROMENT.SECRET_KEY, { expiresIn: '1h' });
            await EmailService.sendSolicitudVerificacion(emailCliente, nombreCliente, fecha, hora, TOKEN);
        } else {
            const datosPro = await UsuarioRepository.findById(profesional);
            await EmailService.sendTurnoConfirmado(
                emailCliente,
                nombreCliente,
                new Date(fecha).toLocaleDateString(),
                hora,
                datosPro.nombre
            );
        }

        return res.status(200).json(
            new ApiResponse(201, 'Turno creado exitosamente', {
                turno: nuevoTurno,
                nuevoUsuario: esNuevoUsuario,
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

        const estadosPermitidos = ['ausente', 'finalizado', 'cancelado'];

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

        //Validar fecha
        const fechaStr = new Date(turno.fecha).toISOString().split('T')[0];
        const fechaHoraTurno = new Date(`${fechaStr}T${turno.hora}:00`);
        const ahora = new Date();

        if (fechaHoraTurno > ahora) {
            if (estado === 'finalizado' || estado === 'ausente') {
                return next(
                    new AppError('No puedes finalizar ni marcar ausente un turno futuro. Solo puedes cancelarlo', 400)
                );
            }
        }

        if (turno.estado === 'cancelado') {
            return next(new AppError('Un turno cancelado no se puede modificar.', 400));
        }

        if (['finalizado', 'ausente'].includes(turno.estado)) {
            if (estado === 'cancelado') {
                return next(new AppError('No puedes cancelar un turno que ya sucedió.', 400));
            }
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
