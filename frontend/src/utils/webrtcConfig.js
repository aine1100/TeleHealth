const parseList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** ICE servers — STUN + optional TURN for phone ↔ desktop across NAT. */
export const getIceServers = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const customTurnUrls = parseList(process.env.REACT_APP_TURN_URLS);
  if (customTurnUrls.length) {
    servers.push({
      urls: customTurnUrls,
      username: process.env.REACT_APP_TURN_USERNAME || '',
      credential: process.env.REACT_APP_TURN_CREDENTIAL || ''
    });
    return servers;
  }

  // Public relay — needed when patient (mobile data) and doctor (Wi‑Fi) are on different networks.
  // Replace with your own TURN server for production scale (Metered, Twilio, coturn, etc.).
  servers.push({
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  });

  return servers;
};

export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

export const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/** Mobile Safari rejects Chrome-specific audio constraint keys. */
export const getMediaConstraints = () => {
  const mobile = isMobileDevice();

  const audio = mobile
    ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    : {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true }
      };

  return {
    video: mobile
      ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      : { facingMode: 'user' },
    audio
  };
};

export const playRemoteMedia = async (videoEl, audioEl) => {
  const attempts = [videoEl, audioEl].filter(Boolean);
  let blocked = false;

  await Promise.all(
    attempts.map(async (el) => {
      if (!el?.srcObject) return;
      try {
        await el.play();
      } catch {
        blocked = true;
      }
    })
  );

  if (blocked) {
    throw new Error('Remote media playback blocked');
  }
};
