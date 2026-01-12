import ApiResponse from '../helpers/api.response.js';
import { generarSlots, getDiasDelMes } from '../helpers/date.helpers.js';
import AppError from '../helpers/error.helpers.js';
import { validaInput } from '../helpers/inputs.helpers.js';
import AusenciaRepository from '../repositories/ausencia.repository.js';
import DisponibilidadRepository from '../repositories/disponibilidad.repository.js';
import TurnosRepository from '../repositories/turno.repository.js';
import UsuarioRepository from '../repositories/usuario.repository.js';

export const createDisponibilidad = async (req, res, next) => {
    try {
        const { profesional, dias, horaInicio, horaFin, duracionTurno } = req.body;
        const schema = {
            dias: { type: 'array', required: true },
            profesional: { type: 'string', required: true, min: 24, max: 24 },
            horaInicio: { type: 'time', required: true, isBefore: 'horaFin' },
            horaFin: { type: 'time', required: true },
            duracionTurno: { type: 'number', required: true, min: 15, max: 60 },
        };

        const errores = validaInput(req.body, schema);
        if (errores.length > 0) {
            return next(new AppError('Errores de validacion', 400, errores));
        }

        const buscado = await UsuarioRepository.getProfesional(profesional);
        if (!buscado) {
            return next(new AppError('El profesional buscado no existe', 401));
        }

        for (const dia of dias) {
            const hayConflicto = await DisponibilidadRepository.verificarSolapamiento(
                buscado._id,
                dia,
                horaInicio,
                horaFin
            );
            if (hayConflicto) {
                return next(
                    new AppError(
                        `El horario ${horaInicio}-${horaFin} se solapa con otro turno existente (de ${hayConflicto.horaInicio} a ${hayConflicto.horaFin}) para el día ${dia}`,
                        400
                    )
                );
            }
        }

        const new_data = dias.map((dia) => ({
            profesional: buscado._id,
            diaSemana: dia,
            horaInicio,
            horaFin,
            duracionTurno,
        }));

        const nuevaDisponibilidad = await DisponibilidadRepository.create(new_data);

        return res.status(201).json(new ApiResponse(201, 'Disponibilidad creada con exito', nuevaDisponibilidad));
    } catch (error) {
        next(error);
    }
};

export const getDisponibilidadByProfesional = async (req, res, next) => {
    try {
        const { profesionalId } = req.params;

        const schema = {
            profesionalId: {
                type: 'string',
                required: true,
                min: 24,
                max: 24,
            },
        };

        const errores = validaInput(req.params, schema);
        if (errores.length > 0) {
            return next(new AppError('Errores de validacion', 400, errores));
        }

        const disponibilidad = await DisponibilidadRepository.getDisponibilidad(profesionalId);
        if (!disponibilidad) {
            return next(new AppError('No se encuentra disponibilidad', 404));
        }

        return res.status(200).json(new ApiResponse(200, 'disponibilidad:', disponibilidad));
    } catch (error) {
        next(error);
    }
};

export const updateDisponibilidad = async (req, res, next) => {
    try {
        const { profesionalId, id } = req.params;
        const { horaInicio, horaFin, diaSemana, duracionTurno } = req.body;

        const schemaParams = {
            profesionalId: {
                type: 'string',
                required: true,
                min: 24,
                max: 24,
            },
            id: { type: 'string', required: true, min: 24, max: 24 },
        };

        const erroresParams = validaInput(req.params, schemaParams);
        if (erroresParams.length > 0) {
            return next(new AppError('ID o Profesional invalidos', 400, errores));
        }

        const schemaBody = {
            horaInicio: { type: 'time', isBefore: 'horaFin' },
            horaFin: { type: 'time' },
            diaSemana: { type: 'number', min: 0, max: 6 },
            duracionTurno: { type: 'number', min: 15, max: 60 },
        };

        const erroresBody = validaInput(req.body, schemaBody);

        if (erroresBody.length > 0) {
            return next(new AppError('Datos de actualizacion invalidos', 400, erroresBody));
        }

        const disponibilidadActual = await DisponibilidadRepository.getDisponibilidadById(id);
        if (!disponibilidadActual) {
            return next(new AppError('La disponibilidad que intentas actualizar ne existe', 404));
        }

        if (disponibilidadActual.profesional.toString() !== profesionalId) {
            return next(new AppError('Esta disponibilidad no pertenece al profecional indicado', 403));
        }

        const diaAValidar = diaSemana !== undefined ? diaSemana : disponibilidadActual.diaSemana;
        const inicioAValidar = horaInicio || disponibilidadActual.horaInicio;
        const finAValidar = horaFin || disponibilidadActual.horaFin;

        const hayConflicto = await DisponibilidadRepository.verificarSolapamiento(
            profesionalId,
            diaAValidar,
            inicioAValidar,
            finAValidar,
            id
        );

        if (hayConflicto) {
            return next(
                new AppError(
                    `El nuevo horario se solapa con otro ya existente (${hayConflicto.horaInicio}-${hayConflicto.horaFin})`,
                    400
                )
            );
        }

        const actualizacion = await DisponibilidadRepository.updateDisponibilidad(id, req.body);

        return res.status(200).json(new ApiResponse(200, 'Disponibilidad actualizada con exito', actualizacion));
    } catch (error) {
        next(error);
    }
};
export const deleteDisponibilidad = async (req, res, next) => {
    try {
        const { id } = req.params;
        const schema = {
            id: { type: 'string', required: true, min: 24, max: 24 },
        };

        const errores = validaInput(req.params, schema);
        if (errores.length > 0) {
            return next(new AppError('ID invalido', 400));
        }

        const disponibilidad = await DisponibilidadRepository.getDisponibilidadById(id);
        if (!disponibilidad) {
            return next(new AppError('No existe', 400));
        }

        await DisponibilidadRepository.deleteDisponibilidad(id);
        return res.status(200).json(new ApiResponse(200, 'Elimindada con exito'));
    } catch (error) {
        next(error);
    }
};

export const getDiasDisponibles = async (req, res, next) => {
    try {
        const { profesionalId, mes, año } = req.query;

        if (!profesionalId || !mes || !año) {
            return next(new AppError('Faltan parametros(profesionalId, mes, año)', 400));
        }

        const fechaInicioMes = new Date(año, mes - 1, 1);
        const fechaFinMes = new Date(año, mes, 0, 23, 59, 59);

        const [reglasDisponibilidad, ausencias, turnosOcupados] = await Promise.all([
            DisponibilidadRepository.getDisponibilidad(profesionalId),
            AusenciaRepository.findAusenciasEnRango(profesionalId, fechaInicioMes, fechaFinMes),
            TurnosRepository.findTurnosActivosEnRango(profesionalId, fechaInicioMes, fechaFinMes),
        ]);

        if (!reglasDisponibilidad || reglasDisponibilidad.length === 0) {
            return res.status(200).json(new ApiResponse(200, 'El profesional no tiene horarios configurados', []));
        }

        const diasDelMes = getDiasDelMes(mes, año);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const calendario = diasDelMes.map((fechaObj) => {
            const fechaStr = fechaObj.toISOString().split('T')[0];

            if (fechaObj < hoy) {
                return {
                    fecha: fechaStr,
                    estado: 'no_laborable',
                    disponible: false,
                    mensaje: 'Fecha pasada',
                };
            }

            const diaSemana = fechaObj.getDay();

            const ausenciaDelDia = ausencias.find((aus) => fechaObj >= aus.fechaInicio && fechaObj <= aus.fechaFin);

            if (ausenciaDelDia) {
                return {
                    fecha: fechaStr,
                    estado: 'ausente',
                    motivo: ausenciaDelDia.motivo,
                    disponible: false,
                };
            }

            const reglaDelDia = reglasDisponibilidad.filter((d) => d.diaSemana === diaSemana);

            if (reglaDelDia.length === 0) {
                return {
                    fecha: fechaStr,
                    estado: 'no_laborable',
                    disponible: false,
                };
            }

            let totalSlotsPosibles = [];

            reglaDelDia.forEach((regla) => {
                const slotsDeEsteTurno = generarSlots(regla.horaInicio, regla.horaFin, regla.duracionTurno);
                totalSlotsPosibles = [...totalSlotsPosibles, ...slotsDeEsteTurno];
            });

            const turnosDelDia = turnosOcupados.filter((t) => t.fecha.toISOString().split('T')[0]);
            const horasOcupadas = turnosDelDia.map((t) => t.hora);

            const slotsLibres = totalSlotsPosibles.filter((hora) => !horasOcupadas.includes(hora));

            if (slotsLibres.length === 0) {
                return {
                    fecha: fechaStr,
                    estado: 'lleno',
                    disponible: false,
                };
            }

            return {
                fecha: fechaStr,
                estado: 'disponible',
                slots: slotsLibres.length,
                disponible: true,
            };
        });

        res.status(200).json(new ApiResponse(200, 'Calendario calculado', calendario));
    } catch (error) {
        next(error);
    }
};

export const getHorariosDelDia = async (req, res, next) => {
    try {
        const { profesionalId, fecha } = req.query;

        if (!profesionalId || !fecha) {
            return next(new AppError('Faltan parámetros (profesionalId, fecha)', 400));
        }

        const fechaConsultada = new Date(fecha + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaConsultada < hoy) {
            return res.status(200).json(new ApiResponse(200, 'La fecha ya pasó', []));
        }

        const diaSemana = fechaConsultada.getDay();

        const inicioDia = new Date(fecha + 'T00:00:00');
        const finDia = new Date(fecha + 'T23:59:59');

        const [reglasDisponibilidad, ausencias, turnosDelDia] = await Promise.all([
            DisponibilidadRepository.getDisponibilidad(profesionalId),
            AusenciaRepository.findAusenciasEnRango(profesionalId, inicioDia, finDia),
            TurnosRepository.findTurnosActivosEnRango(profesionalId, inicioDia, finDia),
        ]);

        if (ausencias.length > 0) {
            return res.status(200).json(new ApiResponse(200, 'El profesional no trabaja hoy (Ausencia)', []));
        }

        if (!reglasDisponibilidad) {
            return res.status(200).json(new ApiResponse(200, 'Sin configuración', []));
        }

        const reglaDelDia = reglasDisponibilidad.filter((r) => r.diaSemana === diaSemana);

        if (reglaDelDia.length === 0) {
            return res.status(200).json(new ApiResponse(200, 'Dia no laboral', []));
        }

        let todosLosSlots = [];

        reglaDelDia.forEach((regla) => {
            const slots = generarSlots(regla.horaInicio, regla.horaFin, regla.duracionTurno);
            todosLosSlots = [...todosLosSlots, ...slots];
        });

        todosLosSlots.sort();

        const horasOcupadas = turnosDelDia.map((t) => t.hora);
        const slotsLibres = todosLosSlots.filter((slots) => !horasOcupadas.includes(slots));

        return res.status(200).json(new ApiResponse(200, 'Horarios disponibles', slotsLibres));
    } catch (error) {
        next(error);
    }
};
