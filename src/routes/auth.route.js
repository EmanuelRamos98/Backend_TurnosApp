import { Router } from 'express';
import {
    identificarController,
    loginController,
    registerController,
    restaurarClaveController,
    solicitarClaveController,
} from '../controllers/auth.controller.js';

const auhtRoute = Router();

auhtRoute.post('/identificar', identificarController);

auhtRoute.post('/login', loginController);

auhtRoute.post('/solicitar-clave', solicitarClaveController);

auhtRoute.post('/restaurar-clave/:token', restaurarClaveController);

//Para registrar profesionales/admis
auhtRoute.post('/register', registerController);

export default auhtRoute;
