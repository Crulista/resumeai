import { useState } from 'react';
import { X, Zap, Check, Loader2 } from 'lucide-react';
import { createSubscription } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import toast from 'react-hot-toast';

const PLANS = [
  { id: '2day', label: '₹49', period: 'for 2 days', price: 49, popular: false },
  { id: 'weekly', label: '₹99', period: 'per week', price: 99, popular: true },
];

const FEATURES = [
  'Unlimited resume generations',
  'AI-powered bullet rewriting',
  'ATS score optimizer',
  'All 4 templates',
  'Cover letter generator',
];

export default function PaywallModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('weekly');
  const { refreshUser } = useAuth();

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { subscriptionId, razorpayKeyId } = await createSubscription(selected);

      const plan = PLANS.find(p => p.id === selected);
      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: 'ResumeAI',
        description: `${plan.label} ${plan.period}`,
        handler: async () => {
          toast.success('Subscription activated!');
          await refreshUser();
          onClose();
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: '#e85d26' },
      });
      rzp.open();
    } catch (err) {
      toast.error('Failed to start checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-md hover:bg-ink-100 text-ink-400 z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="h-1.5 bg-gradient-to-r from-accent via-accent-light to-warning" />

        <div className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
            <Zap className="w-7 h-7 text-accent" />
          </div>

          <h2 className="font-display text-3xl text-ink-900 mb-2">Unlock Unlimited</h2>
          <p className="text-ink-500 text-sm mb-6">
            You&apos;ve used all 3 free generations. Pick a plan to continue.
          </p>

          {/* Plan selector */}
          <div className="flex gap-3 mb-6">
            {PLANS.map(plan => (
              <button key={plan.id} onClick={() => setSelected(plan.id)}
                className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                  selected === plan.id
                    ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                    : 'border-ink-200 hover:border-ink-300'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full mb-2">
                    Best value
                  </span>
                )}
                <div className="font-display text-3xl text-ink-900">{plan.label}</div>
                <div className="text-xs text-ink-400">{plan.period}</div>
              </button>
            ))}
          </div>

          <ul className="space-y-2.5 mb-6">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-ink-700">
                <Check className="w-3.5 h-3.5 text-success shrink-0" /> {f}
              </li>
            ))}
          </ul>

          <button onClick={handleSubscribe} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4" /> Subscribe</>}
          </button>
          <p className="text-center text-ink-400 text-xs mt-3">Cancel anytime. Powered by Razorpay.</p>
        </div>
      </div>
    </div>
  );
}
