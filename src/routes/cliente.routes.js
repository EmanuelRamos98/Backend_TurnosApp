import { Router } from 'express';
import {
    buscarClienteController,
    deleteClienteController,
    getAllClietnesController,
    getClietnteByIdController,
    updateClienteController,
} from '../controllers/cliente.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const clienteRoute = Router();

//Rutas para visualizar los clientes
clienteRoute.get('/buscar', authMiddleware(['admin', 'profesional']), buscarClienteController);
clienteRoute.get('/', authMiddleware(['admin', 'profesional']), getAllClietnesController);
clienteRoute.get('/:id', authMiddleware(['admin', 'profesional']), getClietnteByIdController);

//Edicion-Eliminacion solo por el admin
clienteRoute.put('/update/:id', authMiddleware(['admin']), updateClienteController);
clienteRoute.delete('/delete/:id', authMiddleware(['admin']), deleteClienteController);
export default clienteRoute;
