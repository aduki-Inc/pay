const { transporter, mailOptions } = require('./config');

// Send mail
const sendMail = async data => {
  const mail = mailOptions(data);
  // console.log('Sending mail:', mail);
  try {
    await transporter.sendMail(mail);
    console.log(`Mail sent to ${data.to}`);
  } catch (error) {
    console.error(`Error sending mail to ${data.to}:`, error);
  }
}

module.exports = {
  sendMail
};