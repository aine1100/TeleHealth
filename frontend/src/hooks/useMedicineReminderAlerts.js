import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import getSocket from '../utils/socket';
import { showLocalNotification } from '../utils/deviceNotifications';

/**
 * Listen for medicine-reminder socket events while the patient is signed in.
 * Shows a toast + browser notification when the tab is open.
 */
export const useMedicineReminderAlerts = () => {
  const { user } = useAuth();
  const seenRef = useRef(new Set());

  useEffect(() => {
    if (!user?._id || user.role !== 'patient') return undefined;

    const socket = getSocket();
    socket.emit('join-user-room', { userId: user._id, role: 'patient' });

    const onReminder = (payload = {}) => {
      const key = payload.tag || `${payload.reminderId}-${payload.time}-${payload.notificationId}`;
      if (key && seenRef.current.has(key)) return;
      if (key) {
        seenRef.current.add(key);
        if (seenRef.current.size > 40) {
          seenRef.current = new Set([...seenRef.current].slice(-20));
        }
      }

      const title = payload.title || 'Medicine reminder';
      const message = payload.message || 'Time to take your medicine';

      toast(message, { icon: '💊', duration: 8000 });
      showLocalNotification({
        title,
        body: message,
        tag: payload.tag || 'alive-health-medicine',
        url: payload.actionUrl || '/patient/medicines'
      });
    };

    socket.on('medicine-reminder', onReminder);
    return () => {
      socket.off('medicine-reminder', onReminder);
    };
  }, [user?._id, user?.role]);
};

export default useMedicineReminderAlerts;
