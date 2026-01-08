import { Router } from 'express';
import {
    createCliente,
    deleteCliente,
    getClienteById,
    getClientes,
    updateCliente,
} from '../controllers/cliente.controller.js';

const clienteRoute = Router();

clienteRoute.get('/clientes/:id', getClienteById);
clienteRoute.get('/clientes', getClientes);

clienteRoute.post('/clientes', createCliente);

clienteRoute.put('/clientes/:id', updateCliente);
clienteRoute.delete('/clientes/:id', deleteCliente);

export default clienteRoute;
