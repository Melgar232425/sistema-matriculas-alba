const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configurar API Key de forma segura
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const logoUrl = 'https://sistema-matriculas-alba.vercel.app/logo_oficial.png';
const EMAIL_FROM_DEFAULT = { name: 'Academia Alba', email: 'alexis052304@gmail.com' };

/**
 * Envía un correo de bienvenida a un nuevo estudiante
 */
const sendWelcomeEmail = async (estudiante) => {
    try {
        console.log(`📧 Enviando bienvenida via BREVO a: ${estudiante.email}`);
        
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `¡Bienvenido a Academia Alba, ${estudiante.nombres}!`;
        sendSmtpEmail.htmlContent = `
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
        `;
        sendSmtpEmail.sender = EMAIL_FROM_DEFAULT;
        sendSmtpEmail.to = [{ email: estudiante.email, name: estudiante.nombres }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email enviado via BREVO: ${data.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ ERROR BREVO:', error.response ? error.response.body : error.message);
        return false;
    }
};

/**
 * Envía un correo de confirmación de matrícula
 */
const sendEnrollmentEmail = async (estudiante, curso, matricula) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Confirmación de Matrícula: ${curso.nombre}`;
        sendSmtpEmail.htmlContent = `<h3>Constancia de Matrícula</h3><p>Curso: ${curso.nombre}</p>`;
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
        sendSmtpEmail.subject = `Recibo de Pago: ${pago.codigo_recibo}`;
        sendSmtpEmail.htmlContent = `<h1>S/ ${pago.monto}</h1><p>Curso: ${cursoNombre}</p>`;
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
        sendSmtpEmail.subject = `¡Bienvenido equipo docente!`;
        sendSmtpEmail.htmlContent = `<h2>Hola ${docente.nombres}</h2>`;
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
        sendSmtpEmail.htmlContent = `<h3>Curso: ${curso.nombre}</h3>`;
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
