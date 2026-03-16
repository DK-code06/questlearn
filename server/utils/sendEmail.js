const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 🟢 UPDATED: Explicitly define the host and secure port instead of using shorthand
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL/TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: 'QuestLearn Command <noreply@questlearn.com>',
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;