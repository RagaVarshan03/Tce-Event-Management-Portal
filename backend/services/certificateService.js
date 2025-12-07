const PDFDocument = require('pdfkit');

exports.generateCertificate = (studentName, eventName, date, venue, clubName) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                layout: 'landscape',
                size: 'A4',
                margin: 0
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Certificate Border
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                .lineWidth(10)
                .stroke('#830000'); // TCE Red Color

            doc.rect(35, 35, doc.page.width - 70, doc.page.height - 70)
                .lineWidth(2)
                .stroke('#000000');

            // Header - College Name
            doc.font('Helvetica-Bold')
                .fontSize(30)
                .fillColor('#830000') // TCE Red
                .text('THIAGARAJAR COLLEGE OF ENGINEERING', 0, 80, {
                    align: 'center'
                });

            doc.font('Helvetica')
                .fontSize(16)
                .fillColor('#333')
                .text('(A Government Aided Autonomous Institution Affiliated to Anna University)', 0, 120, {
                    align: 'center'
                });

            // "Certificate of Participation"
            doc.font('Helvetica-Bold')
                .fontSize(40)
                .fillColor('#D4AF37') // Gold color
                .text('Certificate of Participation', 0, 180, {
                    align: 'center'
                });

            // Body Text
            doc.font('Helvetica')
                .fontSize(20)
                .fillColor('#000000')
                .text('This is to certify that', 0, 240, {
                    align: 'center'
                });

            doc.font('Helvetica-Bold')
                .fontSize(35)
                .fillColor('#830000') // TCE Red
                .text(studentName, 0, 280, {
                    align: 'center',
                    underline: false
                });

            doc.font('Helvetica')
                .fontSize(20)
                .fillColor('#000000')
                .text('has actively participated in the event', 0, 330, {
                    align: 'center'
                });

            doc.font('Helvetica-Bold')
                .fontSize(30)
                .fillColor('#000000')
                .text(eventName, 0, 370, {
                    align: 'center'
                });

            let detailsY = 420;
            if (clubName) {
                doc.font('Helvetica')
                    .fontSize(16)
                    .text(`Organized by ${clubName}`, 0, detailsY, { align: 'center' });
                detailsY += 25;
            }

            doc.font('Helvetica')
                .fontSize(18)
                .text(`Held at ${venue} on ${new Date(date).toLocaleDateString()}`, 0, detailsY, {
                    align: 'center'
                });

            // Signatures
            const signatureY = 500;

            // Left Signature (Event Coordinator)
            doc.fontSize(14)
                .text('Event Coordinator', 100, signatureY, {
                    width: 200,
                    align: 'center'
                });

            // Right Signature (HOD)
            doc.text('Head of Department', doc.page.width - 300, signatureY, {
                width: 200,
                align: 'center'
            });

            // Line above signatures
            doc.moveTo(100, signatureY - 10).lineTo(300, signatureY - 10).stroke();
            doc.moveTo(doc.page.width - 300, signatureY - 10).lineTo(doc.page.width - 100, signatureY - 10).stroke();

            // End the document
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};
