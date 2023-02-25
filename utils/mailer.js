const nodemailer = require('nodemailer');

const MAIL_SETTINGS = {
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAILER_USER, // generated ethereal user
        pass: process.env.MAILER_PASS // generated ethereal password
    },
    tls: {
        ciphers: 'SSLv3'
    }
};

let transporter = nodemailer.createTransport(MAIL_SETTINGS);


module.exports.sendEmail = async function (params) {

    // Objects of Email Response [Approved, Dissaprove, Resubmission]
    let emailInfo = [
        {
            subject: "Scholarship Approved!",
            html: `
            <div class="approved" style=" background-color: #4CAF50;
              color: white;
              padding: 16px;
              font-size: 16px;
              text-align: center;
              border-radius: 5px;
              box-shadow: 0px 0px 10px #888888;">
            <h1 style="margin-top: 0;">Congratulations!</h1>
            <p style="margin-bottom: 10px; font-size: 14px;">Dear ${params.TO}</p>
            <p style="margin-bottom: 10px; font-size: 14px;">We are pleased to inform you that your scholarship application has been approved. Congratulations on this achievement! We are excited to provide you with the financial support you need to continue your education.</p>
            <p style="margin-bottom: 10px; font-size: 14px;">Please let us know if you have any questions or concerns.</p>
            <p style="margin-bottom: 10px; font-size: 14px;">Thank you for your interest in our program and for your hard work in applying.</p>
            <p style="margin-bottom: 10px; font-size: 14px;">Best regards,</p>
            <p style="margin-bottom: 10px; font-size: 14px;">OSDS</p>
            </div>`
        },
        {
            subject: "Scholarship Declined!",
            h2: "Thank you for trying to apply for scholarship.",
            h4: "There are other programs to help you, dont be sad!"
        },
        {
            subject: "File/s Resubmission",
            h2: "You are required to resubmit the following files.",
            h4: "Failure to do so will result in invalidated application.",
            message: params.message
        }
    ];

    try {

        let option = params.option;

        let mailOptions = {
            from: '"OSDS" <ajladines@gmail.com>', // sender address
            to: params.TO,
            subject: `${emailInfo[option].subject}`, // Subject line
            html: `${emailInfo[option].html}`,
            headers: {
                'X-Outlook-Client': 'Microsoft Outlook'
            }
        }


        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return error;
            }
            return (`Message sent: ${info.messageId}`);
        });

    }catch (e) {
        return e.message
    }
}




