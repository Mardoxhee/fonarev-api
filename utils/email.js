const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid");

const sendMail = async (options) => {
  // 1) Create a transporter to send email
  const transporter = nodemailer.createTransport(
    sendgridTransport({
      apiKey: process.env.SENDGRID_API_KEY,
    })
  );

 
  const mailOptions = {
    from: "mardochee.luviki@fonarev.cd",
    to: options.to,
    subject: options.subject,
    message: options.message,
    html: options.html,
  };

  // 3) Actually send the  email
  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;