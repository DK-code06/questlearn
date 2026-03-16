const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter using Gmail (you will need an App Password)
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
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