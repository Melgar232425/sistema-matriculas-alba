const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configurar API Key de forma segura
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const logoUrl = 'https://sistema-matriculas-alba.vercel.app/logo_oficial.png';
const EMAIL_FROM_DEFAULT = { name: 'Academia Alba', email: 'alexis052304@gmail.com' };

// Estilos comunes para mantener la elegancia
const commonStyles = `
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #334155;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
`;

/**
 * Envía un correo de bienvenida a un nuevo estudiante
 */
const sendWelcomeEmail = async (estudiante) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Bienvenido a la Excelencia Académica - Academia Alba`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 2px; font-weight: 800; text-transform: uppercase;">ACADEMIA ALBA</h1>
                    <p style="color: rgba(255,255,255,0.8); margin-top: 10px; font-size: 14px;">Comprometidos con tu futuro profesional</p>
                </div>
                <div style="padding: 40px; background-image: linear-gradient(to bottom, #f8fafc, #ffffff);">
                    <h2 style="color: #1e3a8a; margin-top: 0; font-size: 22px;">¡Bienvenido(a), ${estudiante.nombres}!</h2>
                    <p style="font-size: 16px;">Es un honor para nosotros darte la bienvenida a nuestra institución. Tu camino hacia el éxito académico comienza hoy.</p>
                    
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 5px solid #1e3a8a;">
                        <h3 style="margin-top: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Credenciales de Estudiante</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Código de Alumno:</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1e3a8a;">${estudiante.codigo}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Documento (DNI):</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1e3a8a;">${estudiante.dni}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="font-size: 14px; color: #64748b; text-align: center;">Recuerda que estas credenciales son personales. Puedes usarlas para acceder a nuestra plataforma digital.</p>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Academia Alba - Gestión Académica de Alto Nivel</p>
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
        sendSmtpEmail.subject = `Confirmación de Inscripción - ${curso.nombre}`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: #0f172a; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 20px; letter-spacing: 2px;">CONSTANCIA DE MATRÍCULA</h1>
                </div>
                <div style="padding: 40px;">
                    <h2 style="color: #0f172a; margin-top: 0;">Confirmación de Curso</h2>
                    <p>Estimado(a) <strong>${estudiante.nombres}</strong>, su solicitud de inscripción ha sido procesada correctamente.</p>
                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Curso:</strong> ${curso.nombre}</p>
                        <p style="margin: 5px 0;"><strong>Horario:</strong> ${curso.horario || 'Por asignar'}</p>
                        <p style="margin: 5px 0;"><strong>Periodo:</strong> ${matricula.ciclo || '2026-I'}</p>
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
        sendSmtpEmail.subject = `Recibo de Pago Electrónico - ${pago.codigo_recibo}`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: #059669; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 20px; letter-spacing: 2px;">RECIBO DIGITAL</h1>
                </div>
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 48px; color: #059669; font-weight: 800; margin-bottom: 5px;">S/ ${pago.monto}</div>
                    <p style="color: #64748b; margin-top: 0;">Monto Cancelado Exitosamente</p>
                    <div style="margin-top: 30px; border-top: 2px dashed #e2e8f0; padding-top: 20px;">
                        <p><strong>Recibo N°:</strong> ${pago.codigo_recibo}</p>
                        <p><strong>Concepto:</strong> Pago de curso: ${cursoNombre}</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
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
        sendSmtpEmail.subject = `Bienvenida al Equipo Docente Alba`;
        sendSmtpEmail.htmlContent = `
            <div style="${commonStyles}">
                <div style="background: #1e293b; padding: 40px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 22px;">UNIÓN AL CUERPO DOCENTE</h1>
                </div>
                <div style="padding: 40px;">
                    <h2 style="color: #1e293b;">Bienvenido(a), Prof. ${docente.nombres}</h2>
                    <p>Es un privilegio contar con su experiencia académica en nuestra institución.</p>
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px;">
                        <p><strong>Código de Docente:</strong> ${docente.codigo}</p>
                        <p><strong>Especialidad:</strong> ${docente.especialidad}</p>
                    </div>
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
        sendSmtpEmail.htmlContent = `<h3>Docente, tiene un nuevo curso asignado: ${curso.nombre}</h3>`;
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
