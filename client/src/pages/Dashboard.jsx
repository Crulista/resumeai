import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { generateResume, uploadPDF, getTemplates, renderTemplateAPI } from '../utils/api';
import PaywallModal from '../components/PaywallModal';
import ATSScore from '../components/ATSScore';
import toast from 'react-hot-toast';
import {
  Sparkles, Loader2, FileText, Briefcase, Copy, Download, Upload,
  RotateCcw, Eye, Code, ArrowRight, AlertTriangle, CheckCircle, Info, X,
} from 'lucide-react';

const TEMPLATES = [
  { id: 'classic', name: 'Classic', desc: 'Clean single-column' },
  { id: 'professional', name: 'Professional', desc: 'Blue accents, modern' },
  { id: 'minimal', name: 'Minimal', desc: 'Max whitespace, tech roles' },
  { id: 'executive', name: 'Executive', desc: 'Serif, senior roles' },
];

export default function Dashboard() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState('');
  const [jobDescription, setJD] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [template, setTemplate] = useState('classic');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [viewMode, setViewMode] = useState('preview');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => { if (!authLoading && !user) navigate('/'); }, [user, authLoading, navigate]);

  // PDF upload
  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return toast.error('Only PDF files are accepted');
    if (file.size > 5 * 1024 * 1024) return toast.error('File too large (max 5MB)');

    setUploading(true);
    try {
      const data = await uploadPDF(file);
      setResume(data.text);
      toast.success(`Extracted ${data.charCount.toLocaleString()} characters from ${data.pageCount} page(s)`);
    } catch (err) {
      toast.error(err.message || 'Failed to read PDF');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!resume.trim()) return toast.error('Paste your resume or upload a PDF');
    if (!jobDescription.trim()) return toast.error('Paste the job description');
    if (resume.trim().length < 100) return toast.error('Resume seems too short');

    setGenerating(true);
    setResult(null);

    try {
      const data = await generateResume({ resume, jobDescription, jobTitle, company, template });
      setResult(data);
      await refreshUser();
      toast.success(`Resume generated! ATS Score: ${data.atsScore}%`);
    } catch (err) {
      if (err.status === 402) {
        setShowPaywall(true);
      } else if (err.data?.error === 'missing_fields') {
        toast.error(err.data.message, { duration: 5000 });
      } else {
        toast.error(err.message || 'Generation failed');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    toast.success('Copied!');
  };

  // Download as PDF via print
  const handleDownloadPDF = () => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    iframe.contentWindow?.print();
  };

  // Switch template on result
  const handleTemplateSwitch = async (tid) => {
    setTemplate(tid);
    if (result?.resume) {
      try {
        const { html } = await renderTemplateAPI({ templateId: tid, resume: result.resume });
        setResult(prev => ({ ...prev, html }));
      } catch {}
    }
  };

  const handleReset = () => { setResult(null); setViewMode('preview'); };

  if (authLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-ink-400" /></div>;
  }

  const freeLeft = user?.freeUsesRemaining ?? 0;
  const isSubscribed = user?.subscriptionStatus === 'active';

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900 mb-1">
          {result ? 'Your Tailored Resume' : 'Generate Resume'}
        </h1>
        <p className="text-sm text-ink-500">
          {result
            ? `Generated in ${(result.processingTimeMs / 1000).toFixed(1)}s · ${result.matchedKeywords}/${result.totalKeywords} keywords matched`
            : 'Paste your resume and the job description below.'}
        </p>
      </div>

      {!result ? (
        /* === INPUT MODE === */
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Resume Input */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-ink-400" />
                <h2 className="text-sm font-medium text-ink-700">Your Resume</h2>
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors">
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Upload PDF
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePDFUpload} className="hidden" />
            </div>
            <textarea value={resume} onChange={(e) => setResume(e.target.value)}
              placeholder={"Paste your full master resume here...\n\nOr click 'Upload PDF' above to extract from a PDF file.\n\nInclude all experience, skills, projects, education."}
              className="textarea-field resume-textarea h-[400px] text-sm" />
            <p className="text-xs text-ink-400 mt-2">
              {resume.length > 0 ? `${resume.length.toLocaleString()} chars` : 'Plain text or PDF upload'}
            </p>
          </div>

          {/* JD Input */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-ink-400" />
              <h2 className="text-sm font-medium text-ink-700">Job Description</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="Job title (optional)" className="input-field text-sm py-2" />
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="Company (optional)" className="input-field text-sm py-2" />
            </div>
            <textarea value={jobDescription} onChange={e => setJD(e.target.value)}
              placeholder={"Paste the full job description here...\n\nInclude responsibilities, requirements, nice-to-haves."}
              className="textarea-field h-[340px] text-sm" />
          </div>

          {/* Template picker + generate */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-medium text-ink-500">Template:</span>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    template === t.id ? 'bg-accent text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                  }`}>
                  {t.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-400">
                {isSubscribed ? '⚡ Pro — Unlimited'
                  : freeLeft > 0 ? `✨ ${freeLeft} free generation${freeLeft > 1 ? 's' : ''} remaining`
                  : '🔒 Free generations used — subscribe to continue'}
              </p>
              <button onClick={handleGenerate}
                disabled={generating || !resume.trim() || !jobDescription.trim()}
                className="btn-primary flex items-center gap-2 text-base">
                {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                  : <><Sparkles className="w-5 h-5" /> Generate Resume <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* === OUTPUT MODE with insights sidebar === */
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <ATSScore score={result.atsScore} size={48} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-700">ATS: {result.atsScore}%</p>
                <p className="text-xs text-ink-400">{result.matchedKeywords}/{result.totalKeywords} keywords</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Template switcher */}
                <select value={template} onChange={e => handleTemplateSwitch(e.target.value)}
                  className="input-field py-1.5 px-2 text-xs w-auto">
                  {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                <div className="flex items-center bg-ink-100 rounded-lg p-0.5">
                  {[{ key: 'preview', icon: Eye, label: 'Preview' }, { key: 'text', icon: Code, label: 'Text' }].map(({ key, icon: Icon, label }) => (
                    <button key={key} onClick={() => setViewMode(key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        viewMode === key ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                      }`}>
                      <Icon className="w-3 h-3" />{label}
                    </button>
                  ))}
                </div>

                <button onClick={handleCopy} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={handleDownloadPDF} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                  <Download className="w-3 h-3" /> PDF
                </button>
                <button onClick={handleReset} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> New
                </button>
              </div>
            </div>

            {/* Resume preview - editable via contentEditable in iframe */}
            <div className="card overflow-hidden">
              {viewMode === 'preview' ? (
                <iframe ref={iframeRef} srcDoc={result.html.replace('</head>',
                  `<style>[contenteditable]{outline:none} [contenteditable]:hover{background:rgba(232,93,38,0.05)} [contenteditable]:focus{background:rgba(232,93,38,0.08)}</style>
                  <script>document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('li,p,h1,.entry-title,.entry-left,.entry-sub span,.entry-date,.skills-line,.skill,.contact').forEach(el=>{el.contentEditable='true'});})<\/script></head>`
                )}
                  className="w-full border-0" style={{ height: '850px' }} title="Resume Preview" />
              ) : (
                <pre className="p-6 text-sm text-ink-700 font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-[850px]">
                  {result.text}
                </pre>
              )}
            </div>
            <p className="text-xs text-ink-400 mt-2">
              Click any text in the preview to edit it directly. Then click PDF to download.
            </p>
          </div>

          {/* Insights sidebar */}
          {result.insights && (
            <div className="w-72 shrink-0 hidden lg:block">
              <div className="card p-4 sticky top-20">
                <h3 className="text-sm font-medium text-ink-700 mb-3 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-accent" /> Insights
                </h3>

                {/* Missing skills */}
                {result.insights.missingSkills?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Missing from JD
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.insights.missingSkills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">{s}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-ink-400 mt-1.5">
                      If you have these skills, add them to your master resume and regenerate.
                    </p>
                  </div>
                )}

                {/* Matched skills */}
                {result.insights.matchedSkills?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-success mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Matched
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.insights.matchedSkills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {result.insights.suggestions?.map((s, i) => (
                  <div key={i} className={`mb-3 p-2.5 rounded-lg text-xs ${
                    s.severity === 'high' ? 'bg-red-50 border border-red-200' :
                    s.severity === 'medium' ? 'bg-amber-50 border border-amber-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className="font-medium text-ink-700 mb-1">{s.title}</p>
                    <p className="text-ink-500">{s.tip}</p>
                  </div>
                ))}

                {/* Skills in resume */}
                {result.resume?.skills?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-ink-200">
                    <p className="text-xs font-medium text-ink-500 mb-2">Skills in resume</p>
                    <div className="flex flex-wrap gap-1">
                      {result.resume.skills.map(s => (
                        <span key={s} className="tag text-[10px]">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-50/80 backdrop-blur-sm">
          <div className="card p-8 text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
            <h3 className="font-display text-xl text-ink-800 mb-2">Crafting your resume</h3>
            <p className="text-sm text-ink-500">Parsing → Scoring → Rewriting → Formatting</p>
          </div>
        </div>
      )}

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
