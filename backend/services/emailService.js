const nodemailer = require('nodemailer');

// Create reusable transporter with proper configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        debug: true, // Enable debug output
        logger: true // Log information
    });
};

// Email templates
const emailTemplates = {
    welcome: (name, email) => ({
        from: '"TCE CSBS Event Management" <raga@student.tce.edu>',
        to: email,
        subject: 'Welcome to TCE CSBS Event Management',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Welcome to TCE CSBS Event Management</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${name},</p>
                    <p>Your registration has been successful! You can now log in to register for events.</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    eventNotification: (studentName, studentEmail, eventName, eventDate, eventVenue, eventDescription) => ({
        from: '"TCE CSBS Event Management" <raga@student.tce.edu>',
        to: studentEmail,
        subject: `Event Reminder: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Event Notification</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>This is a reminder for the upcoming event you have registered for:</p>
                    <h3 style="color: #830000;">${eventName}</h3>
                    <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
                    <p><strong>Venue:</strong> ${eventVenue}</p>
                    <p><strong>Description:</strong> ${eventDescription}</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    registrationConfirmation: (studentName, studentEmail, eventName, eventDate, eventVenue) => ({
        from: '"TCE Event Management Portal" <raga@student.tce.edu>',
        to: studentEmail,
        subject: `Registration Confirmed: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Registration Confirmation</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>You have successfully registered for the following event:</p>
                    <h3 style="color: #830000;">${eventName}</h3>
                    <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
                    <p><strong>Venue:</strong> ${eventVenue}</p>
                    <p>We look forward to seeing you there!</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    coordinatorApproved: (name, email) => ({
        from: '"TCE Event Management Portal" <raga@student.tce.edu>',
        to: email,
        subject: 'Coordinator Account Approved',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
                    <h2>Account Approved!</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${name},</p>
                    <p>Great news! Your coordinator account has been approved by the administrator.</p>
                    <p>You can now log in and start creating events for students.</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                           style="background: #830000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Login Now
                        </a>
                    </div>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    coordinatorRejected: (name, email, reason) => ({
        from: '"TCE Event Management Portal" <raga@student.tce.edu>',
        to: email,
        subject: 'Coordinator Account Status',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
                    <h2>Account Application Update</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${name},</p>
                    <p>We regret to inform you that your coordinator account application was not approved.</p>
                    <div style="background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0;">
                        <strong>Reason:</strong>
                        <p style="margin: 5px 0 0 0;">${reason}</p>
                    </div>
                    <p>If you believe this is an error, please contact the administrator.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    eventApproved: (coordinatorName, coordinatorEmail, eventName, eventDate) => ({
        from: '"TCE Event Management Portal" <raga@student.tce.edu>',
        to: coordinatorEmail,
        subject: `Event Approved: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
                    <h2>Event Approved!</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${coordinatorName},</p>
                    <p>Your event has been approved and is now visible to students!</p>
                    <h3 style="color: #830000;">${eventName}</h3>
                    <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
                    <p>Students can now register for this event through the portal.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    eventRejected: (coordinatorName, coordinatorEmail, eventName, reason) => ({
        from: '"TCE Event Management Portal" <raga@student.tce.edu>',
        to: coordinatorEmail,
        subject: `Event Status: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
                    <h2>Event Status Update</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${coordinatorName},</p>
                    <p>Your event submission was not approved.</p>
                    <h3 style="color: #830000;">${eventName}</h3>
                    <div style="background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0;">
                        <strong>Reason:</strong>
                        <p style="margin: 5px 0 0 0;">${reason}</p>
                    </div>
                    <p>You may create a new event addressing the concerns mentioned above.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    })
};

// Send email with retry logic
const sendEmail = async (emailOptions, retries = 3) => {
    const transporter = createTransporter();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempting to send email (attempt ${attempt}/${retries})...`);
            console.log('Email recipient:', emailOptions.to);
            console.log('Email subject:', emailOptions.subject);

            const info = await transporter.sendMail(emailOptions);

            console.log('Email sent successfully!');
            console.log('Message ID:', info.messageId);
            console.log('Response:', info.response);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`Email sending failed (attempt ${attempt}/${retries}):`, error.message);

            if (attempt === retries) {
                console.error('All email sending attempts failed');
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    command: error.command
                });
                return { success: false, error: error.message };
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};

module.exports = {
    sendEmail,
    emailTemplates
};
