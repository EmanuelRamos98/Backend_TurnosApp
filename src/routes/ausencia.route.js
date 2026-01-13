import { Router } from 'express';
import { createAusencia, deleteAusencia, getAusencia } from '../controllers/ausencia.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const ausenciaRoute = Router();

ausenciaRoute.post('/', authMiddleware(['admin', 'profesional']), createAusencia);

ausenciaRoute.get('/:profesionalId', authMiddleware(['admin', 'profesional']), getAusencia);

ausenciaRoute.delete('/delete/:id', authMiddleware(['admin', 'profesional']), deleteAusencia);
export default ausenciaRoute;
