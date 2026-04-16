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
                    <p style="font-size: 15px; color: #475569;">Tu registro ha sido exitoso. Te damos la bienvenida a nuestra comunidad estudiantil.</p>
                    
                    <p style="font-size: 15px; color: #475569;">Puedes acceder a tu <strong>Portal Estudiantil</strong> para ver tu horario, pagos y matrículas en cualquier momento, ingresando con las siguientes credenciales:</p>

                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px dashed #cbd5e1; margin: 20px 0;">
                        <p style="margin: 5px 0; font-size: 14px;"><strong>Usuario/Correo:</strong> ${estudiante.email}</p>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>Código de acceso:</strong> ${estudiante.codigo}</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://sistema-matriculas-alba.vercel.app/portal" style="background: #4361ee; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Ingresar a mi Portal</a>
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

/**
 * Envía un código OTP temporal al estudiante para acceder al portal
 */
const sendOtpEmail = async (estudiante, otp) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Tu código de acceso al Portal - Academia Alba`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: linear-gradient(135deg, #4361ee, #3a0ca3); padding: 30px; text-align: center;">
                    <img src="${logoUrl}" alt="Academia Alba" style="width: 90px; height: auto; margin-bottom: 12px; border-radius: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">PORTAL ESTUDIANTIL</h1>
                </div>
                <div style="padding: 36px 30px; text-align: center;">
                    <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 8px;">¡Hola, ${estudiante.nombres}!</h2>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 28px;">
                        Recibimos una solicitud de acceso a tu portal estudiantil.<br>
                        Usa el siguiente código para ingresar:
                    </p>
                    <div style="background: #f1f5f9; border: 2px dashed #c7d2fe; border-radius: 16px; padding: 28px; margin: 0 auto 28px auto; max-width: 280px;">
                        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Código de acceso</p>
                        <p style="margin: 0; font-size: 42px; font-weight: 900; color: #4361ee; letter-spacing: 10px;">${otp}</p>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px;">
                        ⏱ Este código expira en <strong>10 minutos</strong>.<br>
                        Si no solicitaste este acceso, ignora este mensaje.
                    </p>
                </div>
                <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    Academia Alba Perú &mdash; Sistema de Matrículas © 2026
                </div>
            </div>
        `;
        sendSmtpEmail.sender = EMAIL_FROM_DEFAULT;
        sendSmtpEmail.to = [{ email: estudiante.email, name: estudiante.nombres }];
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        return true;
    } catch (error) { console.error('Error Brevo OTP:', error.message); return false; }
};

module.exports = {
    sendWelcomeEmail,
    sendEnrollmentEmail,
    sendPaymentEmail,
    sendTeacherWelcomeEmail,
    sendTeacherCourseEmail,
    sendOtpEmail
};

