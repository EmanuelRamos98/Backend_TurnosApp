import cron from "node-cron";
import jwt from "jsonwebtoken";
import ENVIROMENT from "../config/enviroment.config.js";
import EmailService from "./email.services.js";
import TurnosRepository from "../repositories/turno.repository.js";

const iniciarCron = () => {
    //Ejecutamos cada una hora
    cron.schedule("* * * * *", async () => {
        const ahora = new Date();

        //Defino los limites
        const limiteAviso = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
        const limiteEliminacion = new Date(
            ahora.getTime() + 2 * 60 * 60 * 1000
        );

        try {
            const turnosParaAvisar = await TurnosRepository.getRecordatorio(
                limiteAviso,
                limiteEliminacion
            );

            for (const turno of turnosParaAvisar) {
                if (turno.cliente?.email) {
                    const token = jwt.sign(
                        { turnoId: turno._id },
                        ENVIROMENT.SECRET_KEY,
                        { expiresIn: "24h" }
                    );

                    await EmailService.sendUltimoAviso(
                        turno.cliente.email,
                        turno.cliente.nombre,
                        new Date(turno.fecha).toLocaleDateString(),
                        turno.hora,
                        token
                    );

                    turno.intentosRecordatorio = 1;
                    await turno.save();
                    console.log(` Recordatorio enviado al turno ${turno._id}`);
                }
            }

            const turnosParaBorrar = await TurnosRepository.getTurnoLimite(
                limiteEliminacion
            );

            for (const turno of turnosParaBorrar) {
                if (turno.cliente?.email) {
                    await EmailService.sendTurnoEliminado(
                        turno.cliente.email,
                        turno.cliente.nombre,
                        new Date(turno.fecha).toLocaleDateString(),
                        turno.hora
                    );
                }
                await TurnosRepository.deleteTurno(turno._id);
                console.log(` Turno ${turno._id} eliminado y liberado.`);
            }
        } catch (error) {
            console.error(" Error en el Cron Job:", error);
        }
    });
};

export default iniciarCron;
