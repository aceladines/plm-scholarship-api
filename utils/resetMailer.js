const mailer = require("./mailer");

// * A function that would take all the applicants that will be reset
module.exports.resetMailer = async (arrayOfApplicants) => {
  // * Get all the emails of the applicants
  const emails = arrayOfApplicants.map((applicant) => applicant.email);

  // * Send email to all the applicants
  for (const email of emails) {
    const sendMail = {
      TO: email,
      option: 5,
    };

    await mailer.sendEmail(sendMail);
  }
};
