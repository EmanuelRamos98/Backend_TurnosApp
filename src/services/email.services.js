import nodemailer from 'nodemailer';
import ENVIROMENT from '../config/enviroment.config.js';

class EmailService {
    static transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: ENVIROMENT.EMAIL,
            pass: ENVIROMENT.KEY_EMAIL,
        },
    });

    // =============================================================
    // MÉTODO GENÉRICO DE ENVÍO
    // =============================================================
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

    // =============================================================
    // NOTIFICACIONES A CLIENTES
    // =============================================================

    // 1. Solicitud de Verificación
    static async sendSolicitudVerificacion(email, nombre, fecha, hora, token) {
        const confirmLink = `${ENVIROMENT.URL_API}/api/turnos/confirmar/${token}`;
        const subject = 'Acción Requerida: Confirma tu Turno';

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <h2 style="color: #27ae60; text-align: center;">Valida tu Reserva</h2>
                <p style="font-size: 16px; color: #555;">Hola <b>${nombre}</b>,</p>
                <p style="font-size: 16px; color: #555;">Has solicitado un turno para el <b>${fecha}</b> a las <b>${hora}</b>.</p>
                <p style="font-size: 16px; color: #555;">Para confirmar y guardar tu lugar, por favor haz click en el siguiente botón:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmLink}" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        CONFIRMAR AHORA
                    </a>
                </div>
                
                <p style="font-size: 12px; color: #999; text-align: center;">Si no solicitaste este turno, puedes ignorar este correo.</p>
            </div>
        `;

        return await this.__enviar(email, subject, html);
    }

    // 2. Último Aviso (Warning)
    static async sendUltimoAviso(email, nombre, fecha, hora, token) {
        const confirmLink = `${ENVIROMENT.URL_API}/api/turnos/confirmar/${token}`;
        const subject = '⚠️ Recordatorio: Confirma tu turno pendiente';

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <h2 style="color: #e67e22; text-align: center;">⏳ Tu turno está por vencer</h2>
                <p style="font-size: 16px; color: #555;">Hola <b>${nombre}</b>,</p>
                <p style="font-size: 16px; color: #555;">Tienes un turno pendiente para el <b>${fecha} a las ${hora}</b> y aún no lo has confirmado.</p>
                <p style="font-size: 16px; color: #555;">Por favor hazlo ahora para no perder tu lugar.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmLink}" style="background-color: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        CONFIRMAR AHORA
                    </a>
                </div>
            </div>
        `;
        return await this.__enviar(email, subject, html);
    }

    // 3. Turno Eliminado (Danger)
    static async sendTurnoEliminado(email, nombre, fecha, hora) {
        const subject = '❌ Turno Cancelado por falta de confirmación';

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <h2 style="color: #c0392b; text-align: center;">Turno Cancelado</h2>
                <p style="font-size: 16px; color: #555;">Hola <b>${nombre}</b>,</p>
                <p style="font-size: 16px; color: #555;">Lamentamos informarte que, al no recibir tu confirmación, tu turno del <b>${fecha} a las ${hora}</b> ha sido liberado automáticamente.</p>
                <p style="font-size: 16px; color: #555;">Si aún deseas atenderte, por favor solicita un turno nuevo a través de nuestra plataforma.</p>
            </div>
        `;
        return await this.__enviar(email, subject, html);
    }

    // 4. Confirmación Exitosa (Success)
    static async sendTurnoConfirmado(email, nombre, fecha, hora, profesional) {
        const subject = '✅ ¡Turno Confirmado!';

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <h2 style="color: #27ae60; text-align: center;">¡Todo listo!</h2>
                <p style="font-size: 16px; color: #555;">Hola <b>${nombre}</b>, tu turno ha sido agendado exitosamente.</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;">📅 <b>Fecha:</b> ${fecha}</p>
                    <p style="margin: 5px 0;">⏰ <b>Hora:</b> ${hora}</p>
                    <p style="margin: 5px 0;">👨‍⚕️ <b>Profesional:</b> ${profesional}</p>
                </div>

                <p style="font-size: 14px; color: #777; text-align: center;">Te esperamos en el consultorio. Si no puedes asistir, por favor cancela con anticipación.</p>
            </div>
        `;

        return await this.__enviar(email, subject, html);
    }

    // 5. Recordatorio General
    static async sendRecordatorio(email, nombreCliente, fecha, hora, nombreProfesional) {
        const subject = '📢 Recordatorio: Tu turno de mañana';

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <h2 style="color: #2980b9; text-align: center;">📅 Recordatorio de Turno</h2>
                <p style="font-size: 16px; color: #555;">Hola <b>${nombreCliente}</b>,</p>
                <p style="font-size: 16px; color: #555;">Te recordamos que mañana tienes una cita confirmada:</p>
                
                <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #2980b9;">
                    <p style="margin: 5px 0;">👨‍⚕️ <b>Profesional:</b> ${nombreProfesional}</p>
                    <p style="margin: 5px 0;">📆 <b>Fecha:</b> ${fecha}</p>
                    <p style="margin: 5px 0;">⏰ <b>Hora:</b> ${hora} hs</p>
                </div>

                <p style="font-size: 12px; color: #999; text-align: center;">Si no puedes asistir, contáctanos para reprogramar.</p>
            </div>
        `;

        return await this.__enviar(email, subject, html);
    }

    // =============================================================
    // GESTIÓN Y SISTEMA
    // =============================================================

    // 6. Agenda del Profesional
    static async sendRecordatorioProfesional(emailProfesional, nombreProfesional, fecha, listaTurnos) {
        const subject = `Agenda del día ${fecha}`;

        // Crear filas dinámicamente
        const filasHTML = listaTurnos
            .map(
                (turno) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${turno.hora}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${turno.cliente.nombre} ${
                    turno.cliente.apellido
                }</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${
                    turno.cliente.telefono || '-'
                }</td>
            </tr>
        `
            )
            .join('');

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <h2 style="color: #2c3e50; text-align: center;">📅 Agenda: ${fecha}</h2>
                <p style="font-size: 16px; color: #555;">Hola <b>${nombreProfesional}</b>, estos son tus pacientes confirmados:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead style="background-color: #f8f9fa;">
                        <tr>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; color: #555;">Hora</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; color: #555;">Paciente</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; color: #555;">Teléfono</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasHTML}
                    </tbody>
                </table>
                
                <p style="margin-top: 30px; text-align: center; color: #777; font-size: 14px;">Que tengas una excelente jornada.</p>
            </div>
        `;
        return await this.__enviar(emailProfesional, subject, html);
    }

    // 7. Aviso de Cancelación (Genérico)
    static async sendAvisoCancelacion(email, asuntoPersonalizado, mensaje) {
        // Nota: Aquí 'subject' viene como parámetro, pero lo asignamos a const para mantener consistencia
        const subject = asuntoPersonalizado;

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <h2 style="color: #c0392b; text-align: center;">❌ Aviso de Cancelación</h2>
                
                <p style="font-size: 16px; color: #333; line-height: 1.5;">${mensaje}</p>

                <div style="margin-top: 20px; padding: 15px; background-color: #fce4e4; border-radius: 5px; color: #c0392b; text-align: center;">
                    <small>⚠️ El turno ha quedado disponible nuevamente en el sistema.</small>
                </div>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
                    Si crees que esto es un error, comunícate con la administración.
                </p>
            </div>
        `;

        return await this.__enviar(email, subject, html);
    }

    // 8. Recuperación de Contraseña / Activar Cuenta
    static async sendRestauracionPassword(email, nombre, codigo) {
        const subject = 'Acción Requerida: Seguridad de tu cuenta';

        const html = `
            Tu código de verificación es: ${codigo}
        `;

        return await this.__enviar(email, subject, html);
    }
}

export default EmailService;
