const { Resend } = require('resend');

const resend = new Resend('re_SMZGPL4B_KgaGwKpvoApWnsCiRZirz4Zo');

const logoUrl = 'https://sistema-matriculas-alba.vercel.app/logo_oficial.png';
// Resend solo permite enviar desde este correo hasta que verifiques un dominio
const EMAIL_FROM_DEFAULT = 'Academia Alba <onboarding@resend.dev>';

/**
 * Envía un correo de bienvenida a un nuevo estudiante
 */
const sendWelcomeEmail = async (estudiante) => {
    try {
        console.log(`📧 Enviando bienvenida via RESEND a: ${estudiante.email}`);
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM_DEFAULT,
            to: estudiante.email,
            subject: `¡Bienvenido a Academia Alba, ${estudiante.nombres}!`,
            html: `
                <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
                    <div style="background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase;">ACADEMIA ALBA</h1>
                    </div>
                    
                    <div style="padding: 30px; line-height: 1.6;">
                        <h2 style="color: #4361ee;">¡Hola, ${estudiante.nombres}!</h2>
                        <p>Tus datos han sido registrados exitosamente en nuestro sistema.</p>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <table style="width: 100%; font-size: 14px;">
                                <tr><td style="color: #64748b;">Código:</td><td style="font-weight: bold;">${estudiante.codigo}</td></tr>
                                <tr><td style="color: #64748b;">DNI:</td><td style="font-weight: bold;">${estudiante.dni}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('❌ ERROR RESEND:', error);
            return false;
        }

        console.log(`✅ Email enviado via RESEND: ${data.id}`);
        return true;
    } catch (error) {
        console.error('❌ ERROR CRITICO EMAIL:', error.message);
        return false;
    }
};

/**
 * Envía un correo de confirmación de matrícula
 */
const sendEnrollmentEmail = async (estudiante, curso, matricula) => {
    try {
        await resend.emails.send({
            from: EMAIL_FROM_DEFAULT,
            to: estudiante.email,
            subject: `Confirmación de Matrícula: ${curso.nombre}`,
            html: `<div style="padding: 20px;"><h3>Constancia de Matrícula</h3><p>Curso: <strong>${curso.nombre}</strong></p></div>`
        });
    } catch(e) { console.error('Error Resend', e); }
};

/**
 * Envía un recibo de pago digital
 */
const sendPaymentEmail = async (estudiante, pago, cursoNombre) => {
    try {
        await resend.emails.send({
            from: EMAIL_FROM_DEFAULT,
            to: estudiante.email,
            subject: `Recibo de Pago: ${pago.codigo_recibo}`,
            html: `<div style="padding: 20px;"><h1>S/ ${pago.monto}</h1><p>Pago de Curso: ${cursoNombre}</p></div>`
        });
    } catch(e) { console.error('Error Resend', e); }
};

/**
 * Envía un correo de bienvenida a un docente
 */
const sendTeacherWelcomeEmail = async (docente) => {
    try {
        await resend.emails.send({
            from: EMAIL_FROM_DEFAULT,
            to: docente.email,
            subject: `¡Bienvenido al Equipo Docente Alba, ${docente.nombres}!`,
            html: `<div style="padding: 20px;"><h2>¡Hola, profesor(a) ${docente.nombres}!</h2></div>`
        });
        return true;
    } catch (error) {
        console.error('Error Resend Docente:', error.message);
        return false;
    }
};

/**
 * Notifica al docente sobre un nuevo curso asignado
 */
const sendTeacherCourseEmail = async (docente, curso) => {
    try {
        await resend.emails.send({
            from: EMAIL_FROM_DEFAULT,
            to: docente.email,
            subject: `Nuevo Curso Asignado: ${curso.nombre}`,
            html: `<div style="padding: 20px;"><h3>Nuevo curso asignado: ${curso.nombre}</h3></div>`
        });
    } catch(e) { console.error('Error Resend curso docente', e.message); }
};

module.exports = {
    sendWelcomeEmail,
    sendEnrollmentEmail,
    sendPaymentEmail,
    sendTeacherWelcomeEmail,
    sendTeacherCourseEmail
};
