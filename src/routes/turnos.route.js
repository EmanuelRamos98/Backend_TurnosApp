import { Router } from "express";
import {
    createTurno,
    deleteTurno,
    getTurnoByProfesional,
    getTurnoByCliente,
    getTurnos,
    updateTurno,
} from "../controllers/turnos.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const turnoRoute = Router();

turnoRoute.get("/:id_profesional", getTurnoByProfesional);
turnoRoute.get("/:id_profesional", getTurnoByCliente);
turnoRoute.get("/", authMiddleware, getTurnos);

turnoRoute.post("/", createTurno);

turnoRoute.put("/:id", updateTurno);

turnoRoute.delete("/:id", deleteTurno);

export default turnoRoute;
