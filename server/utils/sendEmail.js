const axios = require('axios');

const sendEmail = async (options) => {
    // Construct the payload exactly how Brevo expects it
    const data = {
        sender: {
            name: "QuestLearn Command",
            email: process.env.EMAIL_USER // The Gmail you verified on Brevo
        },
        to: [
            {
                email: options.email // The instructor's email
            }
        ],
        subject: options.subject,
        htmlContent: options.message
    };

    // Configure the secure HTTPS web request (Bypasses Render's SMTP block)
    const config = {
        method: 'post',
        url: 'https://api.brevo.com/v3/smtp/email',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
        },
        data: data
    };

    // Send the request!
    await axios(config);
};

module.exports = sendEmail;