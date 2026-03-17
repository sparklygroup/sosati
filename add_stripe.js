const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/server.js', 'utf8');

// Add stripe require after existing requires
const stripeInit = `
// ── STRIPE ───────────────────────────────────────────────
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

`;

// Add after supabase init
c = c.replace(
  '// ── API: REQUISITOS',
  stripeInit + '// ── API: REQUISITOS'
);

// Add payment routes
const stripeRoutes = `
// ── API: STRIPE PAYMENTS ─────────────────────────────────

// Create payment intent for deposit
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { service, appointmentData } = req.body;

    // Deposit amounts by service (in cents)
    const deposits = {
      tax:        5000,  // $50
      accounting: 4000,  // $40
      dmv:        2500,  // $25
      insurance:  3000,  // $30
      notary:     2000,  // $20
      general:    2500   // $25
    };

    const amount = deposits[service] || 2500;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        service,
        clientName: appointmentData.name || '',
        clientPhone: appointmentData.phone || '',
        appointmentDate: appointmentData.date || '',
        appointmentTime: appointmentData.time || '',
        location: appointmentData.location || ''
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount,
      depositLabel: '$' + (amount / 100).toFixed(0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm payment and save appointment
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, appointmentData } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Save appointment with payment info
    const appt = {
      ...appointmentData,
      status: 'confirmed',
      payment_status: 'paid',
      payment_intent_id: paymentIntentId,
      deposit_amount: paymentIntent.amount / 100
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert([appt])
      .select();

    if (error) throw error;

    res.json({ success: true, appointment: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

`;

c = c.replace('// ── API: REQUISITOS', stripeRoutes + '// ── API: REQUISITOS');

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/server.js', c);
console.log('OK - Stripe routes added');
