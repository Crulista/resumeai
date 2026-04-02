import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { generateCoverLetter } from '../utils/api';
import PaywallModal from '../components/PaywallModal';
import toast from 'react-hot-toast';
import { PenTool, Loader2, Copy, RotateCcw, FileText, Briefcase } from 'lucide-react';

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Formal & polished' },
  { id: 'conversational', label: 'Conversational', desc: 'Warm & genuine' },
  { id: 'bold', label: 'Bold', desc: 'Confident & direct' },
];

export default function CoverLetter() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState('');
  const [jobDescription, setJD] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  const handleGenerate = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      return toast.error('Paste both resume and job description.');
    }

    setGenerating(true);
    setResult(null);

    try {
      const data = await generateCoverLetter({ resume, jobDescription, jobTitle, company, tone });
      setResult(data);
      await refreshUser();
      toast.success(`Cover letter generated! ${data.wordCount} words`);
    } catch (err) {
      if (err.status === 402) {
        setShowPaywall(true);
      } else {
        toast.error(err.message || 'Generation failed.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result?.coverLetter) return;
    navigator.clipboard.writeText(result.coverLetter);
    toast.success('Copied!');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900 mb-1">
          {result ? 'Your Cover Letter' : 'Cover Letter Generator'}
        </h1>
        <p className="text-sm text-ink-500">
          {result
            ? `${result.wordCount} words · ${tone} tone`
            : 'Generate a tailored cover letter from your resume and job description.'}
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-ink-400" />
                <h2 className="text-sm font-medium text-ink-700">Your Resume</h2>
              </div>
              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume here..."
                className="textarea-field h-[320px] text-sm"
              />
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-ink-400" />
                <h2 className="text-sm font-medium text-ink-700">Job Description</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Job title"
                  className="input-field text-sm py-2"
                />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company"
                  className="input-field text-sm py-2"
                />
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJD(e.target.value)}
                placeholder="Paste the job description here..."
                className="textarea-field h-[260px] text-sm"
              />
            </div>
          </div>

          {/* Tone selector */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-ink-700 mb-3">Tone</h3>
            <div className="flex gap-3">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    tone === t.id
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                      : 'border-ink-200 hover:border-ink-300'
                  }`}
                >
                  <span className="text-sm font-medium text-ink-800">{t.label}</span>
                  <p className="text-xs text-ink-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={generating || !resume.trim() || !jobDescription.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Writing...
                </>
              ) : (
                <>
                  <PenTool className="w-5 h-5" />
                  Generate Cover Letter
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={handleCopy} className="btn-secondary flex items-center gap-1.5 py-2 px-4 text-sm">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button onClick={() => setResult(null)} className="btn-secondary flex items-center gap-1.5 py-2 px-4 text-sm">
              <RotateCcw className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <div className="card p-8">
            <div className="max-w-2xl mx-auto whitespace-pre-wrap text-ink-700 leading-relaxed text-[15px]">
              {result.coverLetter}
            </div>
          </div>
        </div>
      )}

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
