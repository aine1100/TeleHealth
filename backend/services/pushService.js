const webpush = require('web-push');
const { User } = require('../models');

let configured = false;

const ensureConfigured = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || process.env.EMAIL_FROM || 'mailto:support@alivehealth.ug';

  if (!publicKey || !privateKey) {
    return false;
  }

  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return true;
};

exports.getVapidPublicKey = () => {
  ensureConfigured();
  return process.env.VAPID_PUBLIC_KEY || null;
};

exports.isPushConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

exports.saveSubscription = async (userId, subscription, userAgent = '') => {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    const error = new Error('Invalid push subscription');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(user.pushSubscriptions)) {
    user.pushSubscriptions = [];
  }

  user.pushSubscriptions = user.pushSubscriptions.filter(
    (item) => item.endpoint !== subscription.endpoint
  );

  user.pushSubscriptions.push({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    },
    userAgent: String(userAgent || '').slice(0, 300),
    createdAt: new Date()
  });

  // Keep a reasonable number of devices
  if (user.pushSubscriptions.length > 8) {
    user.pushSubscriptions = user.pushSubscriptions.slice(-8);
  }

  await user.save();
  return user.pushSubscriptions;
};

exports.removeSubscription = async (userId, endpoint) => {
  const user = await User.findById(userId);
  if (!user) return [];
  user.pushSubscriptions = (user.pushSubscriptions || []).filter((item) => item.endpoint !== endpoint);
  await user.save();
  return user.pushSubscriptions;
};

exports.sendToUser = async (userId, payload) => {
  if (!ensureConfigured()) {
    return { sent: 0, skipped: true };
  }

  const user = await User.findById(userId).select('pushSubscriptions notificationSettings');
  if (!user) return { sent: 0 };

  if (user.notificationSettings?.push === false) {
    return { sent: 0, disabled: true };
  }

  const subscriptions = user.pushSubscriptions || [];
  if (!subscriptions.length) return { sent: 0 };

  const body = JSON.stringify({
    title: payload.title || 'Alive Health UG',
    body: payload.message || payload.body || '',
    url: payload.actionUrl || payload.url || '/patient/medicines',
    tag: payload.tag || 'alive-health-medicine',
    data: payload.data || {}
  });

  let sent = 0;
  const staleEndpoints = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          },
          body
        );
        sent += 1;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error('[Push]', error.message || error);
        }
      }
    })
  );

  if (staleEndpoints.length) {
    user.pushSubscriptions = subscriptions.filter((item) => !staleEndpoints.includes(item.endpoint));
    await user.save();
  }

  return { sent, removed: staleEndpoints.length };
};
