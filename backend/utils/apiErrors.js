const DEFAULT_CONSULTATION_FEE = 25000;

/**
 * Log the full error server-side and return a safe message to clients.
 * Only explicit 4xx app errors (with statusCode) expose their message.
 */
const sendErrorResponse = (res, error, { logLabel = 'API', userMessage } = {}) => {
  console.error(`[${logLabel}]`, error);

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors || {})
      .map((entry) => entry.message)
      .join('; ');
    if (details) console.error(`[${logLabel}] Validation details:`, details);
  }

  if (error.statusCode && error.statusCode < 500) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  const statusCode = error.name === 'ValidationError' ? 400 : 500;
  return res.status(statusCode).json({
    success: false,
    message: userMessage || 'Something went wrong. Please try again.'
  });
};

const buildAppointmentPayment = (consultationFee, overrides = {}) => {
  const amount =
    Number(overrides.amount ?? consultationFee) > 0
      ? Number(overrides.amount ?? consultationFee)
      : DEFAULT_CONSULTATION_FEE;
  const platformFee = Number(overrides.platformFee ?? 2000);
  const totalAmount = Number(overrides.totalAmount ?? amount + platformFee);

  return {
    amount,
    platformFee,
    totalAmount,
    currency: overrides.currency || 'UGX',
    status: overrides.status || 'pending',
    method: overrides.method,
    transactionId: overrides.transactionId,
    paidAt: overrides.paidAt,
    flutterwaveRef: overrides.flutterwaveRef
  };
};

module.exports = {
  sendErrorResponse,
  buildAppointmentPayment,
  DEFAULT_CONSULTATION_FEE
};
