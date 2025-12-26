import ApiResponse from "../helpers/api.response.js";
import AppError from "../helpers/error.helpers.js";
import { validaInput } from "../helpers/inputs.helpers.js";
import DisponibilidadRepository from "../repositories/disponibilidad.repository.js";
import UsuarioRepository from "../repositories/usuario.repository.js";

export const createDisponibilidad = async (req, res, next) => {
    try {
        const { profesional, dias, horaInicio, horaFin, duracionTurno } =
            req.body;
        const schema = {
            dias: { type: "array", required: true },
            profesional: { type: "string", required: true, min: 24, max: 24 },
            horaInicio: { type: "time", required: true, isBefore: "horaFin" },
            horaFin: { type: "time", required: true },
            duracionTurno: { type: "number", required: true, min: 15, max: 60 },
        };

        const errores = validaInput(req.body, schema);
        if (errores.length > 0) {
            return next(new AppError("Errores de validacion", 400, errores));
        }

        const buscado = await UsuarioRepository.getProfesional(profesional);
        if (!buscado) {
            return next(new AppError("El profesional buscado no existe", 401));
        }

        for (const dia of dias) {
            const hayConflicto =
                await DisponibilidadRepository.verificarSolapamiento(
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

        const nuevaDisponibilidad = await DisponibilidadRepository.create(
            new_data
        );

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    "Disponibilidad creada con exito",
                    nuevaDisponibilidad
                )
            );
    } catch (error) {
        next(error);
    }
};

export const getDisponibilidadByProfesional = async (req, res, next) => {
    try {
        const { profesional_id } = req.params;

        const schema = {
            profesional_id: {
                type: "string",
                required: true,
                min: 24,
                max: 24,
            },
        };

        const errores = validaInput(req.params, schema);
        if (errores.length > 0) {
            return next(new AppError("Errores de validacion", 400, errores));
        }

        const disponibilidad = await DisponibilidadRepository.getDisponibilidad(
            profesional_id
        );
        if (!disponibilidad) {
            return next(new AppError("No se encuentra disponibilidad", 404));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "disponibilidad:", disponibilidad));
    } catch (error) {
        next(error);
    }
};

export const updateDisponibilidad = async (req, res, next) => {
    try {
        const { profesional_id, id } = req.params;
        const { horaInicio, horaFin, diaSemana, duracionTurno } = req.body;

        const schemaParams = {
            profesional_id: {
                type: "string",
                required: true,
                min: 24,
                max: 24,
            },
            id: { type: "string", required: true, min: 24, max: 24 },
        };

        const erroresParams = validaInput(req.params, schemaParams);
        if (erroresParams.length > 0) {
            return next(
                new AppError("ID o Profesional invalidos", 400, errores)
            );
        }

        const schemaBody = {
            horaInicio: { type: "time", isBefore: "horaFin" },
            horaFin: { type: "time" },
            diaSemana: { type: "number", min: 0, max: 6 },
            duracionTurno: { type: "number", min: 15, max: 60 },
        };

        const erroresBody = validaInput(req.body, schemaBody);

        if (erroresBody.length > 0) {
            return next(
                new AppError(
                    "Datos de actualizacion invalidos",
                    400,
                    erroresBody
                )
            );
        }

        const disponibilidadActual =
            await DisponibilidadRepository.getDisponibilidadById(id);
        if (!disponibilidadActual) {
            return next(
                new AppError(
                    "La disponibilidad que intentas actualizar ne existe",
                    404
                )
            );
        }

        if (disponibilidadActual.profesional.toString() !== profesional_id) {
            return next(
                new AppError(
                    "Esta disponibilidad no pertenece al profecional indicado",
                    403
                )
            );
        }

        const diaAValidar =
            diaSemana !== undefined
                ? diaSemana
                : disponibilidadActual.diaSemana;
        const inicioAValidar = horaInicio || disponibilidadActual.horaInicio;
        const finAValidar = horaFin || disponibilidadActual.horaFin;

        const hayConflicto =
            await DisponibilidadRepository.verificarSolapamiento(
                profesional_id,
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

        const actualizacion =
            await DisponibilidadRepository.updateDisponibilidad(id, req.body);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Disponibilidad actualizada con exito",
                    actualizacion
                )
            );
    } catch (error) {
        next(error);
    }
};
export const deleteDisponibilidad = async (req, res, next) => {
    try {
        const { id } = req.params;
        const schema = {
            id: { type: "string", required: true, min: 24, max: 24 },
        };

        const errores = validaInput(req.params, schema);
        if (errores.length > 0) {
            return next(new AppError("ID invalido", 400));
        }

        const disponibilidad =
            await DisponibilidadRepository.getDisponibilidadById(id);
        if (!disponibilidad) {
            return next(new AppError("No existe", 400));
        }

        await DisponibilidadRepository.deleteDisponibilidad(id);
        return res
            .status(200)
            .json(new ApiResponse(200, "Elimindada con exito"));
    } catch (error) {
        next(error);
    }
};
