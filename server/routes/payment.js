const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Create subscription
router.post('/create-subscription', requireAuth, async (req, res) => {
  try {
    const razorpay = getRazorpay();

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 52, // 52 weeks = 1 year max
      notes: {
        user_id: req.user.id.toString(),
        email: req.user.email,
      },
    });

    // Save subscription ID
    await pool.query(
      'UPDATE users SET subscription_id = $1 WHERE id = $2',
      [subscription.id, req.user.id]
    );

    res.json({
      subscriptionId: subscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Subscription creation error:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Razorpay webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify signature
    const signature = req.headers['x-razorpay-signature'];
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { event: eventType, payload } = event;

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const subId = payload.subscription?.entity?.id;
        const endDate = new Date(payload.subscription?.entity?.current_end * 1000);
        
        await pool.query(
          `UPDATE users SET 
            subscription_status = 'active', 
            subscription_end = $1,
            updated_at = NOW()
          WHERE subscription_id = $2`,
          [endDate, subId]
        );
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const subId = payload.subscription?.entity?.id;
        await pool.query(
          `UPDATE users SET 
            subscription_status = 'cancelled',
            updated_at = NOW()
          WHERE subscription_id = $1`,
          [subId]
        );
        break;
      }

      case 'payment.captured': {
        // Payment successful - logged for analytics
        console.log('Payment captured:', payload.payment?.entity?.id);
        break;
      }

      case 'payment.failed': {
        const subId = payload.payment?.entity?.subscription_id;
        if (subId) {
          await pool.query(
            `UPDATE users SET 
              subscription_status = 'payment_failed',
              updated_at = NOW()
            WHERE subscription_id = $1`,
            [subId]
          );
        }
        break;
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Check subscription status
router.get('/status', requireAuth, async (req, res) => {
  const user = req.user;
  res.json({
    freeUsed: user.free_used,
    subscriptionStatus: user.subscription_status,
    subscriptionEnd: user.subscription_end,
    isActive: user.subscription_status === 'active' && 
              user.subscription_end && 
              new Date(user.subscription_end) > new Date(),
  });
});

// Cancel subscription
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    if (!req.user.subscription_id) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const razorpay = getRazorpay();
    await razorpay.subscriptions.cancel(req.user.subscription_id);

    await pool.query(
      `UPDATE users SET subscription_status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    );

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

module.exports = router;
