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
            horaInicio: { type: "time", required: true },
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

export const updateDisponibilidad = (req, res, next) => {
    try {
        const { profesional_id, id } = req.params;

        const schema = {
            profesional_id: {
                type: "string",
                required: true,
                min: 24,
                max: 24,
            },
            id: { type: "string", required: true, min: 24, max: 24 },
        };

        const errores = validaInput(req.params, schema);
        if (errores.length > 0) {
            return next(new AppError("Errores de validacion", 400, errores));
        }
    } catch (error) {
        next(error);
    }
};
export const deleteDisponibilidad = (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
};
