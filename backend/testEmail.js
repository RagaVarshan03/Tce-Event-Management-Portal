require('dotenv').config();
const { sendEmail, emailTemplates } = require('./services/emailService');

const fs = require('fs');

const testEmail = async () => {
    console.log('Testing email sending...');
    console.log('User:', process.env.EMAIL_USER);

    const emailOptions = emailTemplates.registrationConfirmation(
        'Test User',
        process.env.EMAIL_USER,
        'Test Event',
        new Date(),
        'Test Venue'
    );

    try {
        const result = await sendEmail(emailOptions);
        if (result.success) {
            console.log('Test email sent successfully!');
            fs.writeFileSync('email_result.txt', 'Success');
        } else {
            console.error('Test email failed:', result.error);
            fs.writeFileSync('email_result.txt', `Failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Test script error:', error);
        fs.writeFileSync('email_result.txt', `Error: ${error.message}`);
    }
};

testEmail();
