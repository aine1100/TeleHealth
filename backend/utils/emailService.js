const nodemailer = require('nodemailer');
const twilio = require('twilio');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

exports.sendVerificationEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. OTP not sent.');
    return { success: false, message: 'Email credentials not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@alivehealth.ug',
    to: email,
    subject: 'Verify your Alive Health UG account',
    html: `
      <h3>Welcome to Alive Health UG</h3>
      <p>Your verification code is:</p>
      <h2>${otp}</h2>
      <p>This code will expire in 10 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};

exports.sendOtpSms = async (phone, otp) => {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio SMS credentials not configured. OTP not sent.');
    return { success: false, message: 'SMS credentials not configured' };
  }

  await twilioClient.messages.create({
    body: `Your Alive Health UG verification code is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });

  return { success: true };
};

exports.sendOtpNotification = async ({ email, phone, otp, channel }) => {
  if (channel === 'phone') {
    return exports.sendOtpSms(phone, otp);
  }

  return exports.sendVerificationEmail(email, otp);
};
