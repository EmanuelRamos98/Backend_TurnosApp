import mongoose from 'mongoose';
import ENVIROMENT from './enviroment.config.js';

const MONGO_URI = ENVIROMENT.MONGO_URL + 'Turnos';

const db = mongoose
    .connect(MONGO_URI, {})
    .then(() => {
        console.log('CONEXION: ', true);
    })
    .catch((error) => {
        console.error('CONEXION: ', false);
    })
    .finally(() => {
        console.log('CONEXION: FINAL EXITOSO');
    });

export default db;
