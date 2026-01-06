import cron from "node-cron";
import jwt from "jsonwebtoken";
import ENVIROMENT from "../config/enviroment.config.js";
import EmailService from "./email.services.js";
import TurnosRepository from "../repositories/turno.repository.js";

const iniciarCron = () => {
    //Ejecutamos cada una hora
    cron.schedule("0 * * * *", async () => {
        const ahora = new Date();

        //Defino los limites
        const limiteAviso = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
        const limiteEliminacion = new Date(
            ahora.getTime() + 2 * 60 * 60 * 1000
        );

        try {
            //Buscamos turnos sin confirmar para recordar
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

            //Borramos los turnos no confirmados
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
            if (error.isOperational) {
                console.warn(`Advertencia Lógica en Cron: ${error.message}`);
            } else {
                console.error(" Error en el Cron Job:", error);
            }
        }
    });

    //Todos los dias a las 20hs
    cron.schedule("0 20 * * *", async () => {
        const hoy = new Date();
        const mañana = new Date(hoy);
        mañana.setDate(hoy.getDate() + 1);

        const inicioDia = new Date(mañana.setHours(0, 0, 0, 0));
        const finDia = new Date(mañana.setHours(23, 59, 59, 999));

        try {
            //Traigo los turnos de mañana
            const turnosMañana = await TurnosRepository.getTurnosPorFecha(
                inicioDia,
                finDia
            );

            if (turnosMañana.length === 0) {
                return console.log("No hay turnos para mañana");
            }

            //Notifico a los clientes
            for (const turno of turnosMañana) {
                if (turno.cliente?.email) {
                    try {
                        await EmailService.sendRecordatorio(
                            turno.cliente.email,
                            turno.cliente.nombre,
                            new Date(turno.fecha).toLocaleDateString(),
                            turno.hora,
                            turno.profesional.nombre
                        );
                        console.log(
                            `Recordatorio enviado a cliente ${turno.cliente.email}`
                        );
                    } catch (error) {
                        console.error(
                            `Falló envio a ${turno.cliente.email}`,
                            error.message
                        );
                    }
                }
            }
            //-------------------------------------------------------------------------------------//
            //Notifico a los profesionales
            //Creo el objeto que va a tener por id
            // de profesional su respectivo array con sus turnos
            const agendaProfesional = {};
            turnosMañana.forEach((turno) => {
                const idProf = turno.profesional._id.toString();
                if (!agendaProfesional[idProf]) {
                    agendaProfesional[idProf] = [];
                }
                agendaProfesional[idProf].push(turno);
            });

            //Enviamos los emails
            const idsProfesionales = Object.keys(agendaProfesional);

            for (const id of idsProfesionales) {
                const listadoTurnoDelProfesional = agendaProfesional[id];
                const datosProfesional =
                    listadoTurnoDelProfesional[0].profesional;

                if (datosProfesional && datosProfesional.email) {
                    await EmailService.sendRecordatorioProfesional(
                        datosProfesional.email,
                        datosProfesional.nombre,
                        inicioDia.toLocaleDateString(),
                        listadoTurnoDelProfesional
                    );
                    console.log(
                        `Agenda enviada a ${datosProfesional.nombre} (${listadoTurnoDelProfesional.length} clientes)`
                    );
                }
            }
        } catch (error) {
            console.error("Error enviando agendas:", error);
        }
    });
};

export default iniciarCron;
