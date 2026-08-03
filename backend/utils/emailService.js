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

exports.sendDoctorInviteEmail = async ({
  email,
  clinicName,
  inviteLink,
  firstName,
  specialty,
  expiresInDays = 7
}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Doctor invite not sent.');
    console.info(`Doctor invite link for ${email}: ${inviteLink}`);
    return { success: false, message: 'Email credentials not configured', inviteLink };
  }

  const greeting = firstName ? `Dr. ${firstName}` : 'Doctor';
  const specialtyLine = specialty
    ? `<p>You have been invited as a <strong>${specialty}</strong>.</p>`
    : '';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@alivehealth.ug',
    to: email,
    subject: `${clinicName} invited you to join Alive Health UG`,
    html: `
      <h3>You're invited to Alive Health UG</h3>
      <p>Hello ${greeting},</p>
      <p><strong>${clinicName}</strong> has invited you to join their care team on Alive Health UG.</p>
      ${specialtyLine}
      <p>
        <a href="${inviteLink}" style="display:inline-block;padding:12px 20px;background:#0047CC;color:#fff;text-decoration:none;border-radius:6px;">
          Set up your doctor account
        </a>
      </p>
      <p>Or copy this link into your browser:</p>
      <p>${inviteLink}</p>
      <p>This invite expires in ${expiresInDays} days.</p>
    `
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};
