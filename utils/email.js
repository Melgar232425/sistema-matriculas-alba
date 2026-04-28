const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
        user: 'alexis052304@gmail.com',
        pass: 'wurslqalniaflavc'
    }
});

/**
 * Envía un correo de notificación de inicio de sesión
 */
exports.enviarNotificacionLogin = async (estudianteEmail, estudianteNombre) => {
    try {
        const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
        
        await transporter.sendMail({
            from: '"Seguridad Academia Alba" <alexis052304@gmail.com>',
            to: estudianteEmail,
            subject: "🔔 Nuevo inicio de sesión detectado - Academia Alba",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #0f172a;">Academia Alba Perú</h2>
                    </div>
                    <p>Hola <strong>${estudianteNombre}</strong>,</p>
                    <p>Te informamos que se ha detectado un nuevo inicio de sesión en tu cuenta de la plataforma de la Academia Alba.</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${fecha}</p>
                        <p style="margin: 5px 0;"><strong>Plataforma:</strong> Portal del Estudiante</p>
                    </div>
                    
                    <p>Si fuiste tú, puedes ignorar este mensaje. De lo contrario, por favor contacta con administración de inmediato.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #64748b; text-align: center;">
                        Este es un mensaje automático, por favor no respondas a este correo.
                    </p>
                </div>
            `,
        });
        return true;
    } catch (error) {
        console.error("Error enviando correo de login:", error);
        return false;
    }
};
