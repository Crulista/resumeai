import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHistory } from '../utils/api';
import ATSScore from '../components/ATSScore';
import { ArrowLeft, Loader2, Copy, Download, Eye, Code } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Output() {
  const { id } = useParams();
  const [generation, setGeneration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('text');

  useEffect(() => {
    async function load() {
      try {
        const history = await getHistory();
        const found = history.find((g) => g.id === parseInt(id));
        if (found) setGeneration(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-ink-400" />
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="text-center py-32">
        <p className="text-ink-500 mb-4">Generation not found.</p>
        <Link to="/dashboard" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generation.formatted_text || '');
    toast.success('Copied!');
  };

  return (
    <div className="animate-fade-in">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="flex items-center gap-4 mb-6">
        {generation.ats_score && <ATSScore score={generation.ats_score} size={56} />}
        <div>
          <h1 className="font-display text-2xl text-ink-900">
            {generation.job_title || 'Resume'} {generation.company ? `@ ${generation.company}` : ''}
          </h1>
          <p className="text-xs text-ink-400">
            Generated {new Date(generation.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={handleCopy} className="btn-secondary flex items-center gap-1.5 py-2 px-4 text-sm">
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
      </div>

      <div className="card p-6">
        <pre className="text-sm text-ink-700 font-mono whitespace-pre-wrap leading-relaxed">
          {generation.formatted_text || 'No content available.'}
        </pre>
      </div>
    </div>
  );
}
