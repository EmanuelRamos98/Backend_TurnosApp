import { Router } from 'express';
import {
    identificarController,
    loginController,
    registerController,
    restaurarPasswordController,
    solicitarClaveController,
    solicitarRecuperacionController,
} from '../controllers/auth.controller.js';

const auhtRoute = Router();

auhtRoute.post('/identificar', identificarController);

auhtRoute.post('/login', loginController);

//Para activar un ciente
auhtRoute.post('/solicitar-clave', solicitarClaveController);

//Para cambiar contraseña
auhtRoute.post('/solicitar-recuperacion', solicitarRecuperacionController);
auhtRoute.post('/restaurar-password', restaurarPasswordController);

//Para registrar profesionales/admis
auhtRoute.post('/register', registerController);

export default auhtRoute;
