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
            console.log(`Email enviado a ${to} | Asunto: ${subject}`);
            return true;
        } catch (error) {
            console.error(`Error enviando email a ${to}:`, error);
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
        const subject = "Recordatorio: Confirma tu turno";
        const html = `
            <h2 style="color: #e67e22;">⚠️ Recordatorio de Turno</h2>
            <p>Hola ${nombre}, tienes un turno pendiente para el <b>${fecha} a las ${hora}</b>.</p>
            <p>Por favor confírmalo para no perderlo.</p>
            <a href="${confirmLink}">CONFIRMAR AHORA</a>
        `;
        return await this.__enviar(email, subject, html);
    }

    //Email de eliminacion
    static async sendTurnoEliminado(email, nombre, fecha, hora) {
        const subject = "Turno Cancelado por falta de confirmación";
        const html = `
            <h2 style="color: red;">❌ Turno Cancelado Automáticamente</h2>
            <p>Hola ${nombre},</p>
            <p>Como no recibimos tu confirmación, tu turno del <b>${fecha} a las ${hora}</b> ha sido cancelado y liberado para otro paciente.</p>
            <p>Si aún deseas atenderte, por favor solicita un turno nuevo.</p>
        `;
        return await this.__enviar(email, subject, html);
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
    static async sendRecordatorio(
        email,
        nombreCliente,
        fecha,
        hora,
        nombreProfesional
    ) {
        const subject = "📢 Recordatorio: Tu turno de mañana";
        const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #27ae60;">📅 ¡Recordatorio de tu Turno!</h2>
            <p>Hola <b>${nombreCliente}</b>,</p>
            <p>Te recordamos que mañana tienes un turno confirmado:</p>
            
            <ul style="background-color: #f9f9f9; padding: 15px; list-style: none;">
                <li>👨‍⚕️ <b>Profesional:</b> ${nombreProfesional}</li>
                <li>📆 <b>Fecha:</b> ${fecha}</li>
                <li>⏰ <b>Hora:</b> ${hora} hs</li>
            </ul>

            <p>¡Te esperamos!</p>
            <p style="font-size: 12px; color: #777;">Si no puedes asistir, por favor contáctanos para reprogramar.</p>
        </div>
    `;

        return await this.__enviar(email, subject, html);
    }

    //Recordatorio profesional
    static async sendRecordatorioProfesional(
        emailProfesional,
        nombreProfesional,
        fecha,
        listaTurnos
    ) {
        //Creo filas dinamicamnete
        const filasHTML = listaTurnos
            .map(
                (turno) => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${turno.hora}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
                turno.cliente.nombre
            } ${turno.cliente.apellido}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
                turno.cliente.telefono || "-"
            }</td>
        </tr>
    `
            )
            .join("");

        // HTML del email completo
        const subject = `Agenda del día ${fecha}`;
        const html = `
        <h2 style="color: #2c3e50;">📅 Agenda para mañana: ${fecha}</h2>
        <p>Hola <b>${nombreProfesional}</b>, estos son tus clientes confirmados:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead style="background-color: #f2f2f2;">
                <tr>
                    <th style="padding: 8px; border: 1px solid #ddd;">Hora</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Paciente</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Teléfono</th>
                </tr>
            </thead>
            <tbody>
                ${filasHTML}
            </tbody>
        </table>
        
        <p style="margin-top: 20px;">Que tengas una buena jornada.</p>
    `;
        return await this.__enviar(emailProfesional, subject, html);
    }
}

export default EmailService;
