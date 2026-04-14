const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // 587 uses upgrade to secure
    auth: {
        user: 'alexis052304@gmail.com',
        pass: 'wurslqalniaflavc'
    }
});

async function main() {
    try {
        let info = await transporter.sendMail({
            from: '"Test Alba" <alexis052304@gmail.com>',
            to: 'alexis052304@gmail.com',
            subject: "Prueba de Servidor SMTP",
            text: "Si recibes esto, las credenciales están perfectas.",
        });
        console.log("Mensaje enviado: %s", info.messageId);
    } catch (e) {
        console.log("Error de autenticación o envío:");
        console.error(e);
    }
}

main();
