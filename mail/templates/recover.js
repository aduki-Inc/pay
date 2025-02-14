const { app: { url } } = require('../../configs')
// An email template to recover a user's password: nodemailer
const reset = token => {
	// get current year
	const year = new Date(Date.now()).getFullYear();
	
	return /* html */`
    <html lang="en">
    <head>
      <title>Password Reset</title>
    </head>
    <body>
      <p style="font-size: 18px; padding: 0 5px; margin: 0;">Use the following token to reset your password.</p>
      <p style="color: #08b86f; font-size: 36px; font-weight: 700; text-align: center; padding: 0 5px;" ><strong>${token}</strong></p>
      <p style="font-size: 16px; padding: 0 5px;">This token will expire in 10 minutes.</p>
      <p style="font-size: 18px; padding: 0 5px;">If you did not request a password reset, please ignore this email.</p>
      <div style="padding: 0 5px;">
        <span style="font-size: 16px; display: block;">Regards,</span>
        <span style="font-size: 16px; display: block;">Zoanai</span>
      </div>
      <div style="display: flex; gap: 15px; border-top: 1px solid black; padding: 15px 5px; margin: 20px 0 0;">
        <span style="font-size: 13px; display: block;">©<span style="font-size: 14px;">${year}</span> aduki, Inc</span>
        <a href="${url}/about" style="font-size: 13px; text-decoration: none; padding: 0 15px 0 15px">About</a>
        <a href="${url}/about" style="font-size: 13px; text-decoration: none;">Privacy</a>
      </div>
    </body>
    </html>
  `;
}

module.exports = { reset };