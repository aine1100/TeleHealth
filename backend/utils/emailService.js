const nodemailer = require('nodemailer');
const twilio = require('twilio');

const emailService = (process.env.EMAIL_SERVICE || 'gmail').toLowerCase();
const transporter = nodemailer.createTransport(
  emailService === 'gmail'
    ? {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    : {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT || 587),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
);

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

exports.sendVerificationEmail = async (email, otp, expiresInMinutes = 5) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. OTP not sent.');
    console.info(`Verification OTP for ${email}: ${otp} (expires in ${expiresInMinutes} minutes)`);
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
      <p>This code expires in ${expiresInMinutes} minutes. Request a new one if it times out.</p>
    `
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};

exports.sendOtpSms = async (phone, otp, expiresInMinutes = 5) => {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio SMS credentials not configured. OTP not sent.');
    console.info(`SMS OTP for ${phone}: ${otp} (expires in ${expiresInMinutes} minutes)`);
    return { success: false, message: 'SMS credentials not configured' };
  }

  await twilioClient.messages.create({
    body: `Your Alive Health UG code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });

  return { success: true };
};

exports.sendOtpNotification = async ({ email, phone, otp, channel, expiresInMinutes = 5 }) => {
  if (channel === 'phone') {
    return exports.sendOtpSms(phone, otp, expiresInMinutes);
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. OTP not sent.');
    console.info(`Password reset OTP for ${email}: ${otp} (expires in ${expiresInMinutes} minutes)`);
    return { success: false, message: 'Email credentials not configured' };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@alivehealth.ug',
    to: email,
    subject: 'Reset your Alive Health UG password',
    html: `
      <h3>Password reset</h3>
      <p>Your reset code is:</p>
      <h2>${otp}</h2>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
    `
  });
  return { success: true };
};

exports.sendDoctorInviteEmail = async ({
  email,
  clinicName,
  inviteLink,
  firstName,
  specialty,
  neverExpires = true
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
        <a href="${inviteLink}" style="display:inline-block;padding:12px 20px;background:#0B74FF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Set up your doctor account
        </a>
      </p>
      <p>Or copy this link into your browser:</p>
      <p style="word-break:break-all;">${inviteLink}</p>
      <p>${neverExpires ? 'This invite does not expire.' : 'Please complete setup soon.'}</p>
    `
  };

  await transporter.sendMail(mailOptions);
  return { success: true, inviteLink };
};

exports.sendSupportRequestEmail = async ({ fromUser, subject, message, category = 'general' }) => {
  const reference = `AH-${Date.now().toString(36).toUpperCase()}`;
  const supportInbox =
    process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const body = `
    <h3>Support request</h3>
    <p><strong>Reference:</strong> ${reference}</p>
    <p><strong>Category:</strong> ${category}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Organization / facility:</strong> ${fromUser.facilityName || '—'}</p>
    <p><strong>Contact:</strong> ${fromUser.name || '—'} · ${fromUser.email || '—'} · ${fromUser.phone || '—'}</p>
    <p><strong>Role:</strong> ${fromUser.role || '—'}</p>
    <hr />
    <p style="white-space:pre-wrap;">${String(message || '').replace(/</g, '&lt;')}</p>
  `;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !supportInbox) {
    console.warn('Email credentials not configured. Support request logged only.');
    console.info(`[Support ${reference}] ${fromUser.email}: ${subject}\n${message}`);
    return { success: false, message: 'Email credentials not configured', reference };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@alivehealth.ug',
    to: supportInbox,
    replyTo: fromUser.email,
    subject: `[Support ${reference}] ${subject}`,
    html: body
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@alivehealth.ug',
      to: fromUser.email,
      subject: `We received your request (${reference})`,
      html: `
        <h3>Alive Health UG Support</h3>
        <p>Hello ${fromUser.name || 'there'},</p>
        <p>We received your support request and will respond soon.</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p><strong>Subject:</strong> ${subject}</p>
      `
    });
  } catch (err) {
    console.warn('Support confirmation email failed:', err.message);
  }

  return { success: true, reference };
};
