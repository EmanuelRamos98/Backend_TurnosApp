import { Router } from 'express';
import {
    createDisponibilidad,
    deleteDisponibilidad,
    getDiasDisponibles,
    getDisponibilidadByProfesional,
    getHorariosDelDia,
    updateDisponibilidad,
} from '../controllers/disponibilidad.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const disponibilidadRoute = Router();

//Busca y muestra donde puede elegir turno el cliente
disponibilidadRoute.get('/calendario', getDiasDisponibles);
disponibilidadRoute.get('/horarios', getHorariosDelDia);

disponibilidadRoute.post('/', authMiddleware(['admin', 'profesional']), createDisponibilidad);
disponibilidadRoute.get('/:profesional_id', getDisponibilidadByProfesional);

disponibilidadRoute.delete('/:id', authMiddleware(['admin', 'profesional']), deleteDisponibilidad);

//Admin
disponibilidadRoute.put('/:profesional_id/:id', authMiddleware(['admin', 'profesional']), updateDisponibilidad);

export default disponibilidadRoute;
