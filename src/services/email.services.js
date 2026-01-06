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

    //Metodo generico de ENVIO
    static async __enviar(to, subject, html) {
        try {
            const mailOptions = {
                from: '"Gestor de Turnos" <gesturno17@gmail.com>',
                to: to,
                subject: subject,
                html: html,
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email enviado a ${to} | Asunto: ${subject}`);
            return true;
        } catch (error) {
            console.error(`⛔ Error enviando email a ${to}:`, error);
            return false;
        }
    }

    //Email de verificacion
    static async sendSolicitudVerificacion(email, nombre, fecha, hora, token) {
        const confirmLink = `${ENVIROMENT.URL_API}/api/turnos/confirmar/${token}`;

        const subject = "Accion Requerida: Confirma tu Turno";
        const html = `
            <h1>Hola ${nombre}</h1>
            p>Solicitaste un turno para el <b>${fecha}</b> a las <b>${hora}</b>.</p>
            <p>Para terminar la reserva, haz click abajo:</p>
            <a href="${confirmLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                CONFIRMAR AHORA
            </a>
        `;

        return await this.__enviar(email, subject, html);
    }

    //Email de ultimo aviso
    static async sendUltimoAviso(email, nombre, fecha, hora, token) {
        const confirmLink = `${ENVIROMENT.URL_API}/api/turnos/confirmar/${token}`;
        const html = `
            <h2 style="color: #e67e22;">⚠️ Recordatorio de Turno</h2>
            <p>Hola ${nombre}, tienes un turno pendiente para el <b>${fecha} a las ${hora}</b>.</p>
            <p>Por favor confírmalo para no perderlo.</p>
            <a href="${confirmLink}">CONFIRMAR AHORA</a>
        `;
        return await this.__enviar(
            email,
            "Recordatorio: Confirma tu turno",
            html
        );
    }

    //Email de eliminacion
    static async sendTurnoEliminado(email, nombre, fecha, hora) {
        const html = `
            <h2 style="color: red;">❌ Turno Cancelado Automáticamente</h2>
            <p>Hola ${nombre},</p>
            <p>Como no recibimos tu confirmación, tu turno del <b>${fecha} a las ${hora}</b> ha sido cancelado y liberado para otro paciente.</p>
            <p>Si aún deseas atenderte, por favor solicita un turno nuevo.</p>
        `;
        return await this.__enviar(
            email,
            "Turno Cancelado por falta de confirmación",
            html
        );
    }
    //Email de confirmacion
    static async sendTurnoConfirmado(email, nombre, fecha, hora, profesional) {
        const subject = "✅ ¡Turno Confirmado!";
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="color: green;">¡Listo! Tu turno está agendado.</h1>
                <p>Hola <b>${nombre}</b>, te esperamos en el consultorio.</p>
                <hr>
                <p>📅 <b>Fecha:</b> ${fecha}</p>
                <p>⏰ <b>Hora:</b> ${hora}</p>
                <p>👨‍⚕️ <b>Profesional:</b> ${profesional}</p>
                <hr>
                <p>Si no puedes asistir, por favor cancela con anticipación.</p>
            </div>
        `;

        return await this.__enviar(email, subject, html);
    }

    //Recordatorio
    static async sendRecordatorio(email, nombre, fecha, hora) {
        const subject = "⏰ Recordatorio: Tienes un turno pronto";
        const html = `
            <h1>Hola ${nombre},</h1>
            <p>Te recordamos que tienes un turno agendado para:</p>
            <h2>${fecha} a las ${hora} hs</h2>
            <p>¡No olvides asistir!</p>
        `;

        return await this.__enviar(email, subject, html);
    }
}

export default EmailService;
