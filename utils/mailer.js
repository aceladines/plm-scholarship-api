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
            <div
            style="
                margin: auto;
                max-width: 50rem;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: black;
                padding: 1rem;
                background-color: #f3f3f3;
                border-radius: 1rem;
            "
        >
            <img
                src="https://res.cloudinary.com/dmxftgfzc/image/upload/v1681091507/plm-logo_tbsnsa.png"
                alt=""
                style="width: 100%; max-width: 20rem; margin-bottom: 1rem"
            />
            <div
                style="
                    border-radius: 0.5rem;
                    overflow: hidden;
                    background-color: white;
                    box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.1);
                "
            >
                <div
                    style="
                        background-image: url('https://res.cloudinary.com/dmxftgfzc/image/upload/v1681092968/plm-background_svwks7.jpg');
                        background-size: cover;
                        background-position: center;
                        width: 100%;
                        height: 15rem;
                    "
                ></div>
                <div style="padding: 1rem; display: grid">
                    <div
                        style="
                            text-transform: uppercase;
                            font-weight: bold;
                            font-size: 1.5rem;
                            color: #2fa84f;
                            display: flex;
                            align-items: center;
                            border: 5px solid #2fa84f;
                            border-radius: 50rem;
                            padding: 0.5rem;
                            width: fit-content;
                            margin: 1rem auto;
                        "
                    >
                        <img
                            src="https://res.cloudinary.com/dmxftgfzc/image/upload/v1681091219/icon-check_hrwoau.png"
                            alt=""
                            style="width: 2.5rem; margin-right: 0.5rem"
                        />
                        Approved
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: bold">
                        Congratulations, ${params.TO}!
                    </h1>
                    <p>
                        Your scholarship application has been
                        <span style="text-decoration: underline">approved</span
                        >!
                    </p>
                    <p style="font-size: 1rem">
                        ${params.message}}
                    </p>
                    <p>
                        Please let us know if you have any questions or
                        concerns.
                    </p>
                    <p>Best regards, OSDS</p>
                </div>
            </div>
        </div>`,
    },
    {
      subject: "Scholarship Declined!",
      html: `<div
            style="
                margin: auto;
                max-width: 50rem;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: black;
                padding: 1rem;
                background-color: #f3f3f3;
                border-radius: 1rem;
            "
        >
            <img
                src="https://res.cloudinary.com/dmxftgfzc/image/upload/v1681091507/plm-logo_tbsnsa.png"
                alt=""
                style="width: 100%; max-width: 20rem; margin-bottom: 1rem"
            />
            <div
                style="
                    border-radius: 0.5rem;
                    overflow: hidden;
                    background-color: white;
                    box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.1);
                "
            >
                <div
                    style="
                        background-image: url('https://res.cloudinary.com/dmxftgfzc/image/upload/v1681092968/plm-background_svwks7.jpg');
                        background-size: cover;
                        background-position: center;
                        width: 100%;
                        height: 15rem;
                    "
                ></div>
                <div style="padding: 1rem; display: grid">
                    <div
                        style="
                            text-transform: uppercase;
                            font-weight: bold;
                            font-size: 1.5rem;
                            color: #ea3d2f;
                            display: flex;
                            align-items: center;
                            border: 5px solid #ea3d2f;
                            border-radius: 50rem;
                            padding: 0.5rem;
                            width: fit-content;
                            margin: 1rem auto;
                        "
                    >
                        <img
                            src="https://res.cloudinary.com/dmxftgfzc/image/upload/v1681091219/icon-disapproved_vgrygl.png"
                            alt=""
                            style="width: 2.5rem; margin-right: 0.5rem"
                        />
                        Disapproved
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: bold">
                        Dear ${params.TO},
                    </h1>
                    <p>
                        We regret to inform you that your scholarship
                        application has been
                        <span style="text-decoration: underline"
                            >disapproved</span
                        >. We understand that this may be disappointing news and
                        we apologize for any inconvenience this may cause.
                    </p>
                    <p>
                       ${params.message}
                    </p>

                    <p>
                        Thank you for your interest in our program and for your
                        hard work in applying. We encourage you to reapply in
                        the future or explore other financial aid opportunities.
                    </p>
                    <p>
                        If you have any questions or concerns, please do not
                        hesitate to reach out to us.
                    </p>
                    <p>Best regards, OSDS</p>
                </div>
            </div>
        </div>`,
    },
    {
      subject: "File/s Resubmission",
      html: ` <div
            style="
                margin: auto;
                max-width: 50rem;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: black;
                padding: 1rem;
                background-color: #f3f3f3;
                border-radius: 1rem;
            "
        >
            <img
                src="https://res.cloudinary.com/dmxftgfzc/image/upload/v1681091507/plm-logo_tbsnsa.png"
                alt=""
                style="width: 100%; max-width: 20rem; margin-bottom: 1rem"
            />
            <div
                style="
                    border-radius: 0.5rem;
                    overflow: hidden;
                    background-color: white;
                    box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.1);
                "
            >
                <div
                    style="
                        background-image: url('https://res.cloudinary.com/dmxftgfzc/image/upload/v1681092968/plm-background_svwks7.jpg');
                        background-size: cover;
                        background-position: center;
                        width: 100%;
                        height: 15rem;
                    "
                ></div>
                <div style="padding: 1rem; display: grid">
                    <div
                        style="
                            text-transform: uppercase;
                            font-weight: bold;
                            font-size: 1.5rem;
                            color: #f3a72e;
                            display: flex;
                            align-items: center;
                            border: 5px solid #f3a72e;
                            border-radius: 50rem;
                            padding: 0.5rem;
                            width: fit-content;
                            margin: 1rem auto;
                        "
                    >
                        <img
                            src="https://res.cloudinary.com/dmxftgfzc/image/upload/v1681091219/icon-clock_outv4d.png"
                            alt=""
                            style="width: 2.5rem; margin-right: 0.5rem"
                        />
                        Resubmission
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: bold">
                        Dear ${params.TO}},
                    </h1>
                    <p>
                        Your scholarship application has been subjected to
                        <span style="text-decoration: underline"
                            >resubmission</span
                        >!
                    </p>
                    <p>
                        ${params.message}
                    </p>
                    <p>
                        Please resubmit your scholarship application with the
                        correct information as soon as possible to prevent the
                        termination of your application.
                    </p>
                    <p>
                        If you have any questions or concerns, please do not
                        hesitate to reach out to us.
                    </p>
                    <p>Best regards, OSDS</p>
                </div>
            </div>
        </div>`,
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
