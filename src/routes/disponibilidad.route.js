import { Router } from "express";
import {
    createDisponibilidad,
    deleteDisponibilidad,
    getDisponibilidadByProfesional,
    updateDisponibilidad,
} from "../controllers/disponibilidad.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const disponibilidadRoute = Router();

disponibilidadRoute.post("/", authMiddleware, createDisponibilidad);
disponibilidadRoute.get("/:profesional_id", getDisponibilidadByProfesional);
disponibilidadRoute.put(
    "/:profesional_id/:id",
    authMiddleware,
    updateDisponibilidad
);
disponibilidadRoute.delete("/:id", authMiddleware, deleteDisponibilidad);

export default disponibilidadRoute;
