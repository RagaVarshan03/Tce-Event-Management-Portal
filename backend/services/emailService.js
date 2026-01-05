const https = require('https');

// Helper to send email via Brevo HTTP API (Bypasses SMTP blocks)
const sendViaBrevoAPI = (options) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            return reject(new Error('BREVO_API_KEY is missing in environment variables'));
        }

        const data = JSON.stringify({
            sender: {
                name: "TCE Event Portal",
                email: process.env.EMAIL_USER || '9f1e7e001@smtp-brevo.com'
            },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html,
            attachment: options.attachments ? options.attachments.map(att => ({
                content: att.content.toString('base64'),
                name: att.filename
            })) : undefined
        });

        const reqOptions = {
            hostname: 'api.brevo.com',
            port: 443,
            path: '/v3/smtp/email',
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(reqOptions, (res) => {
            let responseBody = '';
            res.on('data', (d) => { responseBody += d; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, messageId: JSON.parse(responseBody).messageId });
                } else {
                    reject(new Error(`Brevo API Error (${res.statusCode}): ${responseBody}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
};

// Email templates
const emailTemplates = {
    welcome: (name, email) => ({
        from: `"TCE CSBS Event Management" <${process.env.EMAIL_USER}>`,
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
        from: `"TCE CSBS Event Management" <${process.env.EMAIL_USER}>`,
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
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
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
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
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
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
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
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
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
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
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
    }),

    eventUpdate: (studentName, studentEmail, eventName, changes) => ({
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `Update: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #ffc107; color: black; padding: 20px; text-align: center;">
                    <h2>Event Update Notification</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>There have been some changes to the event you registered for:</p>
                    <h3 style="color: #830000;">${eventName}</h3>
                    <div style="background: white; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0;">
                        <strong>Changes Made:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            ${changes.map(change => `<li>${change}</li>`).join('')}
                        </ul>
                    </div>
                    <p>Please check your student dashboard for the most up-to-date details.</p>
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

    certificateDistribution: (studentName, studentEmail, eventName) => ({
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `Certificate of Participation: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
                    <h2>Certificate of Participation</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Thank you for participating in <strong>${eventName}</strong>.</p>
                    <p>We are pleased to present you with this Certificate of Participation.</p>
                    <p>Please find your certificate attached to this email.</p>
                    <p>We look forward to your active participation in our future events.</p>
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

    waitlistJoined: (studentName, studentEmail, eventName) => ({
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `Waitlist Confirmed: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #ffc107; color: black; padding: 20px; text-align: center;">
                    <h2>You are on the Waitlist</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>The event <strong>${eventName}</strong> is currently full.</p>
                    <p>You have been added to the <strong>Waitlist</strong>. If a spot opens up, you will be automatically registered and notified via email.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                    </div>
                </div>
            </div>
        `
    }),

    waitlistPromoted: (studentName, studentEmail, eventName, date, venue) => ({
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `Spot Confirmed! You are registered for ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
                    <h2>Spot Confirmed!</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Good news! A spot has opened up for <strong>${eventName}</strong>.</p>
                    <p>You have been moved from the waitlist to the <strong>Confirmed Registration</strong> list.</p>
                    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                    <p><strong>Venue:</strong> ${venue}</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                    </div>
                </div>
            </div>
        `
    }),

    feedbackRequest: (studentName, studentEmail, eventName, eventId) => ({
        from: `"TCE Event Management Portal" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `How was ${eventName}?`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #17a2b8; color: white; padding: 20px; text-align: center;">
                    <h2>We'd love your feedback!</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Thank you for attending <strong>${eventName}</strong>.</p>
                    <p>We would appreciate if you could take a moment to rate the event.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student-dashboard" 
                           style="background: #830000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            Rate Event
                        </a>
                    </div>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                    </div>
                </div>
            </div>
        `
    })
};

/**
 * Send email with retry logic and fallback to Mock Mode
 */
const sendEmail = async (emailOptions, retries = 3) => {
    // Check for Mock Mode
    if (process.env.MOCK_EMAIL === 'true') {
        console.log('------- MOCK EMAIL MODE -------');
        console.log('To:', emailOptions.to);
        console.log('Subject:', emailOptions.subject);
        console.log('-------------------------------');
        return { success: true, messageId: 'mock-id-' + Date.now() };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Email via Brevo API(attempt ${attempt}/ ${retries})...`);
            const result = await sendViaBrevoAPI(emailOptions);
            return result;
        } catch (error) {
            console.error(`Brevo API failed(attempt ${attempt} / ${retries}): `, error.message);
            if (attempt === retries) {
                return { success: false, error: error.message };
            }
            // exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};

module.exports = {
    sendEmail,
    emailTemplates
};
