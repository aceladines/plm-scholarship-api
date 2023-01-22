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
            h2: "Congratulations! you are now qualified for the University scholarship program!",
            h4: "Please standby for more information in accordance to OSDS."
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
            html: `<div class="container" style="max-width: 90%; margin: auto; padding-top: 20px">
                    <h2>${emailInfo[option].h2}</h2>
                    <h4>${emailInfo[option].h4}</h4>
                    <p style="margin-bottom: 30px;">${emailInfo[option].message || ''} </p>
                   </div>`,
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




