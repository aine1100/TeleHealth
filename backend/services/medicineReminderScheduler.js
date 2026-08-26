const cron = require('node-cron');
const { MedicineReminder, User } = require('../models');
const notificationService = require('./notificationService');

const pad = (value) => String(value).padStart(2, '0');

const formatHm = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const parseHm = (value) => {
  const [h, m] = String(value || '')
    .split(':')
    .map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const minutesToHm = (total) => {
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${pad(h)}:${pad(m)}`;
};

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Fire medicine dose notifications at (or shortly before) scheduled times.
 * Runs every minute. Uses the server timezone (set TZ=Africa/Kampala in production).
 */
exports.processDueMedicineReminders = async (io) => {
  const now = new Date();
  const currentHm = formatHm(now);
  const today = dateKey(now);

  const reminders = await MedicineReminder.find({
    status: 'active',
    'reminderSettings.enabled': { $ne: false },
    times: { $exists: true, $ne: [] },
    $or: [{ startDate: { $lte: now } }, { startDate: { $exists: false } }],
    $and: [
      {
        $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }]
      }
    ]
  }).limit(500);

  let fired = 0;

  for (const reminder of reminders) {
    const patientId = reminder.patient?.toString?.() || reminder.patient;
    if (!patientId) continue;

    const patient = await User.findById(patientId)
      .select('notificationSettings')
      .lean();
    if (patient?.notificationSettings?.medicineReminders === false) continue;
    if (patient?.notificationSettings?.push === false && patient?.notificationSettings?.email === false) {
      // Still allow in-app + socket unless medicine reminders are off
    }

    const leadMinutes = Number(reminder.reminderSettings?.reminderTime);
    const lead = Number.isFinite(leadMinutes) ? Math.max(0, leadMinutes) : 0;
    const times = Array.isArray(reminder.times) ? reminder.times : [];

    for (const doseTime of times) {
      const doseMinutes = parseHm(doseTime);
      if (doseMinutes == null) continue;

      const notifyHm = minutesToHm(doseMinutes - lead);
      if (notifyHm !== currentHm) continue;

      const slotKey = `${today}T${doseTime}`;
      const already = (reminder.notifiedSlots || []).some((slot) => slot.slotKey === slotKey);
      if (already) continue;

      const alreadyLogged = (reminder.logs || []).some((log) => {
        if (!log?.date || !['taken', 'skipped', 'missed'].includes(log.status)) return false;
        return dateKey(new Date(log.date)) === today && String(log.time) === String(doseTime);
      });
      if (alreadyLogged) continue;

      await notificationService.notifyMedicineDose(reminder, {
        io,
        slotTime: doseTime,
        leadMinutes: lead
      });

      reminder.notifiedSlots = [
        ...(reminder.notifiedSlots || []).filter((slot) => {
          // Keep ~14 days of history
          return slot.slotKey && slot.slotKey >= `${dateKey(new Date(now.getTime() - 14 * 86400000))}T00:00`;
        }),
        { slotKey, notifiedAt: new Date() }
      ];
      await reminder.save();
      fired += 1;
    }
  }

  if (fired > 0) {
    console.log(`[MedicineReminders] Fired ${fired} dose alert(s) at ${currentHm}`);
  }

  return fired;
};

exports.startMedicineReminderScheduler = (io) => {
  // Every minute at second 0
  const task = cron.schedule('* * * * *', () => {
    exports.processDueMedicineReminders(io).catch((error) => {
      console.error('[MedicineReminders]', error.message || error);
    });
  });

  console.log('⏰ Medicine reminder scheduler started (every minute)');
  return task;
};
