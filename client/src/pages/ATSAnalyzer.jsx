import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { analyzeATS } from '../utils/api';
import ATSScore from '../components/ATSScore';
import toast from 'react-hot-toast';
import { Search, Loader2, RotateCcw, AlertTriangle, CheckCircle, Info, FileText, Briefcase } from 'lucide-react';

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-500' },
  important: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' },
  moderate: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-500' },
};

export default function ATSAnalyzer() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState('');
  const [jobDescription, setJD] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  const handleAnalyze = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      return toast.error('Paste both resume and job description.');
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const data = await analyzeATS({ resume, jobDescription });
      setResult(data);
    } catch (err) {
      toast.error(err.message || 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
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
        <h1 className="font-display text-3xl text-ink-900 mb-1">ATS Score Analyzer</h1>
        <p className="text-sm text-ink-500">
          See how well your resume matches a job description before applying.
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
                className="textarea-field h-[360px] text-sm"
              />
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-ink-400" />
                <h2 className="text-sm font-medium text-ink-700">Job Description</h2>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJD(e.target.value)}
                placeholder="Paste the job description here..."
                className="textarea-field h-[360px] text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !resume.trim() || !jobDescription.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {analyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
              ) : (
                <><Search className="w-5 h-5" /> Analyze ATS Score</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score + reset */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ATSScore score={result.score} size={80} />
              <div>
                <p className="font-display text-2xl text-ink-900">{result.score}% Match</p>
                <p className="text-sm text-ink-500">
                  {result.matchedKeywords} of {result.totalKeywords} keywords found
                </p>
              </div>
            </div>
            <button onClick={() => setResult(null)} className="btn-secondary flex items-center gap-1.5 text-sm">
              <RotateCcw className="w-3.5 h-3.5" /> New Analysis
            </button>
          </div>

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-ink-700">Recommendations</h3>
              {result.suggestions.map((s, i) => {
                const style = SEVERITY_STYLES[s.type] || SEVERITY_STYLES.moderate;
                const Icon = style.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${style.bg} ${style.border}`}>
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.iconColor}`} />
                    <p className="text-sm text-ink-700">{s.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Keyword breakdown */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Technical */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-ink-700 mb-3">Technical Keywords</h3>
              {result.breakdown?.technical?.matched?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-success font-medium mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Found in your resume
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.breakdown.technical.matched.map(kw => (
                      <span key={kw} className="tag !bg-success/10 !text-success !border-success/20 text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.breakdown?.technical?.missing?.length > 0 && (
                <div>
                  <p className="text-xs text-red-500 font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Missing from your resume
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.breakdown.technical.missing.map(kw => (
                      <span key={kw} className="tag !bg-red-50 !text-red-600 !border-red-200 text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section analysis */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-ink-700 mb-3">Resume Structure</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Contact Info', ok: result.sectionAnalysis?.hasContact },
                  { label: 'Professional Summary', ok: result.sectionAnalysis?.hasSummary },
                  { label: 'Experience', ok: result.sectionAnalysis?.experienceCount > 0, detail: `${result.sectionAnalysis?.experienceCount || 0} entries` },
                  { label: 'Skills', ok: result.sectionAnalysis?.skillCount >= 5, detail: `${result.sectionAnalysis?.skillCount || 0} skills` },
                  { label: 'Projects', ok: result.sectionAnalysis?.projectCount > 0, detail: `${result.sectionAnalysis?.projectCount || 0} entries` },
                  { label: 'Education', ok: result.sectionAnalysis?.educationCount > 0 },
                  { label: 'Quantified Bullets', ok: (result.sectionAnalysis?.quantifiedBullets || 0) >= 3, detail: `${result.sectionAnalysis?.quantifiedBullets || 0} of ${result.sectionAnalysis?.totalBullets || 0}` },
                ].map(({ label, ok, detail }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {ok ? (
                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span className="text-ink-700">{label}</span>
                    </div>
                    {detail && <span className="text-xs text-ink-400">{detail}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* General keywords */}
          {result.breakdown?.general?.matched?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-medium text-ink-700 mb-3">General Keyword Matches</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.breakdown.general.matched.map(kw => (
                  <span key={kw} className="tag text-xs">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
