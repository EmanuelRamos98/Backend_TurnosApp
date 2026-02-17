import { Router } from 'express';
import {
    createTurno,
    verifyTurno,
    getMisTurnosCliente,
    getMisTurnosProfesional,
    cancelarTurno,
    marcarEstadoTurno,
    getAllTunos,
} from '../controllers/turnos.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const turnoRoute = Router();
//Cliente
turnoRoute.post('/:profesionalId', createTurno);
turnoRoute.get('/confirmar/:token', verifyTurno);
turnoRoute.get('/mis-turnos', authMiddleware(['cliente']), getMisTurnosCliente);
turnoRoute.patch('/:id/cancelar', authMiddleware(['cliente', 'profesional', 'admin']), cancelarTurno);

//Profesional & Admin
turnoRoute.get('/mi-agenda', authMiddleware(['profesional', 'admin']), getMisTurnosProfesional);
turnoRoute.patch('/:id/estado', authMiddleware(['profesional', 'admin']), marcarEstadoTurno);
turnoRoute.post('/create-priv', authMiddleware(['admin', 'profesional']), createTurno);

//Admin
turnoRoute.get('/', authMiddleware(['admin']), getAllTunos);
export default turnoRoute;
