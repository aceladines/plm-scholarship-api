const nodemailer = require("nodemailer");

const MAIL_SETTINGS = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAILER_USER, // generated ethereal user
    pass: process.env.MAILER_PASS, // generated ethereal password
  },
  tls: {
    ciphers: "SSLv3",
  },
};

let transporter = nodemailer.createTransport(MAIL_SETTINGS);

module.exports.sendEmail = async function (params) {
  // Objects of Email Response [Approved, Dissaprove, Resubmission]
  let emailInfo = [
    {
      subject: "Scholarship Approved!",
      html: `
            <body
        style="
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: white;
            padding: 0.5rem;
        "
    >
        <div style="margin: auto; max-width: 50rem">
            <img
                src="https://plm.edu.ph/images/ui/plm-logo--with-header.png"
                alt=""
                style="width: 100%; max-width: 20rem"
            />
            <div
                style="
                    background-color: #2b9949;
                    border-radius: 0.5rem;
                    padding: 2rem;
                "
            >
                <h1 style="font-size: 1.25rem">Dear, ${params.TO}</h1>
                <h2 style="font-size: 1.5rem">
                    Congratulations! Your scholarship application has been
                    <span style="text-decoration: underline">approved!</span>
                </h2>
                <p style="font-size: 1rem">
                   ${params.message}
                </p>
                <p>Please let us know if you have any questions or concerns.</p>
                <p>Best regards, OSDS</p>
            </div>
        </div>
    </body>`,
    },
    {
      subject: "Scholarship Declined!",
      html: `<body
        style="
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: white;
            padding: 0.5rem;
        "
    >
        <div style="margin: auto; max-width: 50rem">
            <img
                src="https://plm.edu.ph/images/ui/plm-logo--with-header.png"
                alt=""
                style="width: 100%; max-width: 20rem"
            />
            <div
                style="
                    background-color: #a92b22;
                    border-radius: 0.5rem;
                    padding: 2rem;
                "
            >
                <h1 style="font-size: 1.25rem">Dear, ${params.TO}</h1>
                <h2 style="font-size: 1.5rem">
                    Your scholarship application has been
                    <span style="text-decoration: underline">disapproved!</span>
                </h2>
                <p>
                    We regret to inform you that your scholarship application
                    has been declined. We understand that this may be
                    disappointing news and we apologize for any inconvenience
                    this may cause.
                </p>
                <p>
                    ${params.message}
                </p>
                <p>
                    Thank you for your interest in our program and for your hard
                    work in applying. We encourage you to reapply in the future
                    or explore other financial aid opportunities.
                </p>
                <p>
                    If you have any questions or concerns, please do not
                    hesitate to reach out to us.
                </p>
                <p>Best regards, OSDS</p>
            </div>
        </div>
    </body>`,
    },
    {
      subject: "File/s Resubmission",
      html: `<body
        style="
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: white;
            padding: 0.5rem;
        "
    >
        <div style="margin: auto; max-width: 50rem">
            <img
                src="https://plm.edu.ph/images/ui/plm-logo--with-header.png"
                alt=""
                style="width: 100%; max-width: 20rem"
            />
            <div
                style="
                    background-color: #cf8e27;
                    border-radius: 0.5rem;
                    padding: 2rem;
                "
            >
                <h1 style="font-size: 1.25rem">Dear, ${params.TO}</h1>
                <h2 style="font-size: 1.5rem">
                    Your scholarship application has been subjected to
                    <span style="text-decoration: underline"
                        >resubmission!</span
                    >
                </h2>
                <p>
                    ${params.message}
                </p>
                <p>
                    Please resubmit your application with the correct
                    information as soon as possible to prevent the termination
                    of your application.
                </p>
                <p>
                    If you have any questions or concerns, please do not
                    hesitate to reach out to us.
                </p>
                <p>Best regards, OSDS</p>
            </div>
        </div>
    </body>`,
    },
  ];

  try {
    let option = params.option;

    let mailOptions = {
      from: '"OSDS" <ajladines@gmail.com>', // sender address
      to: params.TO,
      subject: `${emailInfo[option].subject}`, // Subject line
      html: `${emailInfo[option].html}`,
      headers: {
        "X-Outlook-Client": "Microsoft Outlook",
      },
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return error;
      }
      return `Message sent: ${info.messageId}`;
    });
  } catch (e) {
    return e.message;
  }
};
