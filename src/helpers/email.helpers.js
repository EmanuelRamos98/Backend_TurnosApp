import nodemailer from "nodemailer";
import ENVIROMENT from "../config/enviroment.config.js";

class EmailService {
    static transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: ENVIROMENT.EMAIL,
            pass: ENVIROMENT.KEY_EMAIL,
        },
    });

    static async emailConfirmTurno(
        emailDestino,
        nombreCliente,
        turnoId,
        fecha,
        hora,
        token
    ) {
        const confirmLink = `${ENVIROMENT.URL_API}/api/turnos/confirmar/${token}`;

        const mailOptions = {
            from: '"Profesional test" gesturno17@gmail.com',
            to: emailDestino,
            subject: "Confirmación de Turno Requerida",
            html: `
                <h1>Hola ${nombreCliente},</h1>
                <p>Has solicitado un turno para el día <b>${fecha}</b> a las <b>${hora}</b>.</p>
                <p>Por favor, confirma tu asistencia haciendo click en el siguiente botón:</p>
                <a href="${confirmLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    CONFIRMAR TURNO
                </a>
                <p>Si no fuiste tú, ignora este mensaje.</p>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log("📧 Email enviado correctamente a:", emailDestino);
            return true;
        } catch (error) {
            console.error("⛔ Error enviando email:", error);
            return false;
        }
    }
}

export default EmailService;
