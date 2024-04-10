
const nodemailer = require("nodemailer");

const sendEMail = async (options) => {
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: "Outlook365",
    host: 'smtp.office365.com',
    port: '587',
    secure: false,

    auth: {
      user: "noreply@fonarev.cd", 
      pass: "Adminsys1636" 
    }
  });

  // send mail with defined transport object
  const mailOptions = {
    from: "noreply@fonarev.cd", // sender address
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  //const info = await transporter.sendMail(message);
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        console.log('E-mail envoyé : ' + info.response);
        resolve(info);
      }
    });
  });
  // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

module.exports = sendEMail;