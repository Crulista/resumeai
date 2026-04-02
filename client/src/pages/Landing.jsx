import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FileText, Zap, Target, Clock, ArrowRight, Sparkles, Mail, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Landing() {
  const { user, loginGoogle, loginEmail, signupEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  // Google login
  const handleGoogleInit = useCallback(() => {
    if (!window.google || !import.meta.env.VITE_GOOGLE_CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try { await loginGoogle(response.credential); navigate('/dashboard'); }
        catch (err) { toast.error('Google login failed'); }
      },
    });
    window.google.accounts.id.renderButton(document.getElementById('google-btn'), {
      theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 320,
    });
  }, [loginGoogle, navigate]);

  useEffect(() => {
    const t = setInterval(() => { if (window.google) { handleGoogleInit(); clearInterval(t); } }, 100);
    return () => clearInterval(t);
  }, [handleGoogleInit]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill in all fields');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signupEmail({ email, password, name });
      } else {
        await loginEmail({ email, password });
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 overflow-hidden">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
      }} />

      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl text-ink-800">ResumeAI</span>
        </div>
      </nav>

      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" /> AI-powered resume tailoring
        </div>

        <h1 className="font-display text-5xl sm:text-7xl text-ink-900 leading-[1.05] mb-6">
          One resume.<br /><span className="italic text-accent">Every</span> job.
        </h1>

        <p className="text-lg sm:text-xl text-ink-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Paste your master resume + a job description. Get a perfectly tailored,
          ATS-optimized 1-page resume in seconds.
        </p>

        {/* Auth card */}
        <div className="max-w-sm mx-auto">
          <div className="card p-6">
            {/* Google */}
            <div id="google-btn" className="flex justify-center min-h-[44px] mb-4" />

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-ink-200" />
              <span className="text-xs text-ink-400">or {mode === 'signup' ? 'sign up' : 'log in'} with email</span>
              <div className="flex-1 h-px bg-ink-200" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'signup' && (
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name" className="input-field text-sm" />
              )}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email address" className="input-field text-sm" required />
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)" className="input-field text-sm pr-10" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                {submitting ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Log In'}
              </button>
            </form>

            <p className="text-xs text-ink-400 text-center mt-4">
              {mode === 'login' ? (
                <>Don&apos;t have an account? <button onClick={() => setMode('signup')} className="text-accent font-medium">Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={() => setMode('login')} className="text-accent font-medium">Log in</button></>
              )}
            </p>
          </div>
          <p className="text-xs text-ink-400 mt-3">3 free generations — no card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Target, title: 'Smart Matching', desc: 'Extracts JD keywords and scores every bullet for relevance.' },
            { icon: Zap, title: 'AI Rewriting', desc: 'Strengthens your bullets without inventing facts.' },
            { icon: Clock, title: 'Under 30 Seconds', desc: 'From paste to polished 1-page resume. No fiddling.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-ink-600" />
              </div>
              <h3 className="font-display text-xl text-ink-800 mb-2">{title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <h2 className="font-display text-3xl text-center text-ink-800 mb-12">Three steps. That&apos;s it.</h2>
        <div className="flex flex-col sm:flex-row items-start gap-8">
          {[
            { step: '01', title: 'Paste', desc: 'Drop in your resume (text or PDF) and the job description.' },
            { step: '02', title: 'Generate', desc: 'Our engine matches, scores, and rewrites.' },
            { step: '03', title: 'Edit & Download', desc: 'Review insights, tweak, and download your tailored PDF.' },
          ].map(({ step, title, desc }, i) => (
            <div key={step} className="flex-1 flex items-start gap-4">
              <span className="font-mono text-sm text-accent font-medium mt-1">{step}</span>
              <div>
                <h3 className="font-display text-xl text-ink-800 mb-1">{title}</h3>
                <p className="text-sm text-ink-500">{desc}</p>
              </div>
              {i < 2 && <ArrowRight className="hidden sm:block w-5 h-5 text-ink-300 mt-1 shrink-0" />}
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-ink-200 py-8 text-center text-xs text-ink-400">
        <p>&copy; {new Date().getFullYear()} ResumeAI. Built with purpose.</p>
      </footer>
    </div>
  );
}
