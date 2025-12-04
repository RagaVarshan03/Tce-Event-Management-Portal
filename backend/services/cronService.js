const cron = require('node-cron');
const Student = require('../models/Student');
const { sendEmail, emailTemplates } = require('./emailService');

const initCronJobs = () => {
    // Schedule task to run every 30 days
    // '0 0 */30 * *' runs at 00:00 on every 30th day of the month
    // For testing purposes, we can use '* * * * *' to run every minute
    cron.schedule('0 0 */30 * *', async () => {
        console.log('Running monthly credit alert check...');
        try {
            const students = await Student.find({ credits: { $lt: 3 } });
            console.log(`Found ${students.length} students with low credits.`);

            for (const student of students) {
                const emailResult = await sendEmail(emailTemplates.creditAlert(student.name, student.email, student.credits));
                if (emailResult.success) {
                    console.log(`Alert sent to ${student.email}`);
                } else {
                    console.error(`Failed to send alert to ${student.email}`);
                }
            }
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
};

module.exports = initCronJobs;
