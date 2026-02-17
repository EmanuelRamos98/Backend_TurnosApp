import { Router } from 'express';
import { getProfesionales } from '../controllers/profesional.controller.js';

const profesionalRoute = Router();

profesionalRoute.get('/', getProfesionales);

export default profesionalRoute;
