const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');


const transporter = nodemailer.createTransport({
    // IP Directa de Google para saltarnos TODA la red de Railway e IPv6
    host: '173.194.216.108', 
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || 'alexis052304@gmail.com',
        pass: process.env.EMAIL_PASS || 'wurslqalniaflavc'
    },
    // Esto es CLAVE para que Gmail acepte la conexión segura por IP
    tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false
    }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ ERROR SMTP:', error.message);
    } else {
        console.log('✅ SERVIDOR DE CORREO LISTO (SMTP)');
    }
});

const logoUrl = 'https://sistema-matriculas-alba.vercel.app/logo_oficial.png';
const EMAIL_FROM_DEFAULT = '"Academia Alba" <alexis052304@gmail.com>';

/**
 * Envía un correo de bienvenida a un nuevo estudiante
 */
const sendWelcomeEmail = async (estudiante) => {
    const from_email = EMAIL_FROM_DEFAULT;
    const mailOptions = {
        from: from_email,
        to: estudiante.email,
        subject: `¡Bienvenido a Academia Alba, ${estudiante.nombres}!`,
        html: `
            <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
                <div style="background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%); padding: 30px; text-align: center;">
                    <img src="${logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 10px;">
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
    };

    try {
        console.log(`📧 Intentando enviar bienvenida a: ${estudiante.email}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado exitosamente: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ ERROR al enviar bienvenida:', error.message);
        return false;
    }
};

/**
 * Envía un correo de confirmación de matrícula
 */
const sendEnrollmentEmail = async (estudiante, curso, matricula) => {
    const from_email = EMAIL_FROM_DEFAULT;
    const mailOptions = {
        from: from_email,
        to: estudiante.email,
        subject: `Confirmación de Matrícula: ${curso.nombre}`,
        html: `
            <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: #4361ee; padding: 25px; text-align: center;">
                    <img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;">
                    <h1 style="color: white; margin: 0; font-size: 20px;">ACADEMIA ALBA</h1>
                </div>
                <div style="padding: 30px;">
                    <h3>Constancia de Matrícula</h3>
                    <p>Curso: <strong>${curso.nombre}</strong></p>
                    <p>Horario: <strong>${curso.horario || 'No especificado'}</strong></p>
                </div>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch(e) { console.error('Error Email', e); }
};

/**
 * Envía un recibo de pago digital
 */
const sendPaymentEmail = async (estudiante, pago, cursoNombre) => {
    const from_email = EMAIL_FROM_DEFAULT;
    const mailOptions = {
        from: from_email,
        to: estudiante.email,
        subject: `Recibo de Pago: ${pago.codigo_recibo}`,
        html: `
            <div style="font-family: 'Arial', sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #f1f5f9; border-radius: 16px; overflow: hidden;">
                <div style="background-color: #059669; padding: 20px; text-align: center;">
                    <img src="${logoUrl}" style="max-height: 60px; margin-bottom: 5px;">
                    <h1 style="color: white; margin: 0; font-size: 16px;">ACADEMIA ALBA</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <div style="font-size: 32px; color: #059669; font-weight: bold;">S/ ${pago.monto}</div>
                    <p>Pago de Curso: ${cursoNombre}</p>
                </div>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch(e) { console.error('Error Email', e); }
};

/**
 * Envía un correo de bienvenida a un docente
 */
const sendTeacherWelcomeEmail = async (docente) => {
    const from_email = EMAIL_FROM_DEFAULT;
    const mailOptions = {
        from: from_email,
        to: docente.email,
        subject: `¡Bienvenido al Equipo Docente Alba, ${docente.nombres}!`,
        html: `
            <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
                <div style="background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%); padding: 30px; text-align: center;">
                    <img src="${logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 10px;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase;">ACADEMIA ALBA</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <h2 style="color: #4361ee;">¡Hola, profesor(a) ${docente.nombres}!</h2>
                    <p>Es un placer darle la bienvenida al equipo docente de nuestra institución.</p>
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <table style="width: 100%; font-size: 14px;">
                            <tr><td style="color: #64748b;">Código Docente:</td><td style="font-weight: bold;">${docente.codigo}</td></tr>
                            <tr><td style="color: #64748b;">Especialidad:</td><td style="font-weight: bold;">${docente.especialidad}</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error enviando email a docente:', error.message);
        return false;
    }
};

/**
 * Notifica al docente sobre un nuevo curso asignado
 */
const sendTeacherCourseEmail = async (docente, curso) => {
    const from_email = EMAIL_FROM_DEFAULT;
    const mailOptions = {
        from: from_email,
        to: docente.email,
        subject: `Nuevo Curso Asignado: ${curso.nombre}`,
        html: `
            <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: #0f172a; padding: 25px; text-align: center;">
                    <img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;">
                    <h1 style="color: white; margin: 0; font-size: 20px;">ASIGNACIÓN DE CURSO</h1>
                </div>
                <div style="padding: 30px;">
                    <h3>Detalles de tu nuevo curso</h3>
                    <p><strong>Curso:</strong> ${curso.nombre}</p>
                    <p><strong>Horario:</strong> ${curso.horario || 'Por definir'}</p>
                    <p><strong>Aula:</strong> ${curso.aula || 'Por asignar'}</p>
                    <p><strong>Nivel / Especialidad:</strong> ${curso.nivel || 'General'}</p>
                </div>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch(e) {
        console.error('Error enviando curso a docente:', e.message);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendEnrollmentEmail,
    sendPaymentEmail,
    sendTeacherWelcomeEmail,
    sendTeacherCourseEmail
};
