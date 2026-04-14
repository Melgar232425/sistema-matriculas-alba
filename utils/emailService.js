const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configurar API Key de forma segura
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// LOGO OFICIAL (Aseguramos que la URL sea accesible)
const logoUrl = 'https://sistema-matriculas-alba.vercel.app/logo_oficial.png';
const EMAIL_FROM_DEFAULT = { name: 'Academia Alba', email: 'alexis052304@gmail.com' };

// Estilos ultra-ligeros para evitar que Gmail corte el correo
const commonStyles = "font-family: Arial, sans-serif; color: #334155; max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;";

/**
 * Envía un correo de bienvenida a un nuevo estudiante
 */
const sendWelcomeEmail = async (estudiante) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Bienvenido a Academia Alba`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: #1e3a8a; padding: 30px; text-align: center;">
                    <img src="${logoUrl}" alt="Logo Academia Alba" style="width: 100px; height: auto; margin-bottom: 15px; border-radius: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Academia Alba</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #1e3a8a; font-size: 20px;">¡Hola, ${estudiante.nombres}!</h2>
                    <p style="font-size: 15px;">Tu registro ha sido exitoso. Te damos la bienvenida a nuestra comunidad estudiantil.</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px dashed #cbd5e1; margin: 20px 0;">
                        <p style="margin: 5px 0; font-size: 14px;"><strong>Código:</strong> ${estudiante.codigo}</p>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>DNI:</strong> ${estudiante.dni}</p>
                    </div>
                </div>
                <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
                    Este es un mensaje institucional automatizado.
                </div>
            </div>
        `;
        sendSmtpEmail.sender = EMAIL_FROM_DEFAULT;
        sendSmtpEmail.to = [{ email: estudiante.email, name: estudiante.nombres }];
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        return true;
    } catch (error) { console.error('Error Brevo:', error.message); return false; }
};

/**
 * Envía un correo de confirmación de matrícula
 */
const sendEnrollmentEmail = async (estudiante, curso, matricula) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Matrícula Confirmada - ${curso.nombre}`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: #0f172a; padding: 25px; text-align: center;">
                    <img src="${logoUrl}" style="width: 80px; height: auto; margin-bottom: 10px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 18px;">CONSTANCIA DE MATRÍCULA</h1>
                </div>
                <div style="padding: 25px;">
                    <p style="font-size: 15px;">Se ha confirmado su vacante en el siguiente curso:</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                        <p style="margin: 5px 0;"><strong>Curso:</strong> ${curso.nombre}</p>
                        <p style="margin: 5px 0;"><strong>Horario:</strong> ${curso.horario || 'Por asignar'}</p>
                    </div>
                </div>
            </div>
        `;
        sendSmtpEmail.sender = EMAIL_FROM_DEFAULT;
        sendSmtpEmail.to = [{ email: estudiante.email }];
        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch(e) { console.error('Error Brevo Enrollment', e.message); }
};

/**
 * Envía un recibo de pago digital
 */
const sendPaymentEmail = async (estudiante, pago, cursoNombre) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Recibo Digital - ${pago.codigo_recibo}`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: #059669; padding: 25px; text-align: center;">
                    <img src="${logoUrl}" style="width: 80px; height: auto; margin-bottom: 10px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 18px;">RECIBO DE PAGO</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <div style="font-size: 38px; color: #059669; font-weight: bold;">S/ ${pago.monto}</div>
                    <p style="color: #64748b;">Concepto: ${cursoNombre}</p>
                    <p style="font-size: 12px; margin-top: 20px;">Nro Recibo: ${pago.codigo_recibo}</p>
                </div>
            </div>
        `;
        sendSmtpEmail.sender = EMAIL_FROM_DEFAULT;
        sendSmtpEmail.to = [{ email: estudiante.email }];
        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch(e) { console.error('Error Brevo Pago', e.message); }
};

/**
 * Envía un correo de bienvenida a un docente
 */
const sendTeacherWelcomeEmail = async (docente) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Bienvenida Docente`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: #1e293b; padding: 25px; text-align: center;">
                    <img src="${logoUrl}" style="width: 80px; height: auto;">
                </div>
                <div style="padding: 25px;">
                    <h2>Bienvenido, Prof. ${docente.nombres}</h2>
                    <p>Su código institucional es: <strong>${docente.codigo}</strong></p>
                </div>
            </div>
        `;
        sendSmtpEmail.sender = EMAIL_FROM_DEFAULT;
        sendSmtpEmail.to = [{ email: docente.email }];
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        return true;
    } catch (error) { console.error('Error Brevo Docente', error.message); return false; }
};

const sendTeacherCourseEmail = async (docente, curso) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Nuevo Curso Asignado`;
        sendSmtpEmail.htmlContent = `<div style="${commonStyles}; padding: 20px;">Curso asignado: ${curso.nombre}</div>`;
        sendSmtpEmail.sender = EMAIL_FROM_DEFAULT;
        sendSmtpEmail.to = [{ email: docente.email }];
        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch(e) { console.error('Error Brevo Curso Docente', e.message); }
};

module.exports = {
    sendWelcomeEmail,
    sendEnrollmentEmail,
    sendPaymentEmail,
    sendTeacherWelcomeEmail,
    sendTeacherCourseEmail
};
