// Paywall check middleware - 3 free uses then block
function checkPaywall(req, res, next) {
  const user = req.user;

  // Active subscription - always allow
  if (
    user.subscription_status === 'active' &&
    user.subscription_end &&
    new Date(user.subscription_end) > new Date()
  ) {
    req.isFreeUse = false;
    return next();
  }

  // Has free uses remaining
  if (user.free_uses_remaining > 0) {
    req.isFreeUse = true;
    return next();
  }

  // Blocked - needs payment
  return res.status(402).json({
    error: 'subscription_required',
    message: 'You\'ve used all 3 free generations. Subscribe to continue.',
    plans: [
      { id: '2day', label: '₹49 for 2 days', price: 49 },
      { id: 'weekly', label: '₹99 per week', price: 99 },
    ],
  });
}

module.exports = { checkPaywall };
