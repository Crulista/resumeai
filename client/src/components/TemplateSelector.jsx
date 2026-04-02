import { useState, useEffect } from 'react';
import { getTemplates, renderTemplate } from '../utils/api';
import { Layout, Check, Loader2 } from 'lucide-react';

export default function TemplateSelector({ resume, onTemplateRendered }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState('classic');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => {
        setTemplates([
          { id: 'classic', name: 'Classic', description: 'Traditional single-column format.' },
          { id: 'modern', name: 'Modern', description: 'Two-column with accent sidebar.' },
          { id: 'minimal', name: 'Minimal', description: 'Ultra-clean with max whitespace.' },
          { id: 'executive', name: 'Executive', description: 'Bold serif header. Senior roles.' },
        ]);
      });
  }, []);

  const handleSelect = async (templateId) => {
    if (!resume) return;
    setSelected(templateId);
    setLoading(true);

    try {
      const { html } = await renderTemplate({ templateId, resume });
      onTemplateRendered?.(html, templateId);
    } catch (err) {
      console.error('Template render failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (templates.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Layout className="w-4 h-4 text-ink-400" />
        <h3 className="text-sm font-medium text-ink-700">Template</h3>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-ink-400" />}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg border text-left transition-all ${
              selected === t.id
                ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                : 'border-ink-200 hover:border-ink-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {selected === t.id && <Check className="w-3 h-3 text-accent" />}
              <span className="text-sm font-medium text-ink-800">{t.name}</span>
            </div>
            <p className="text-[11px] text-ink-400 mt-0.5 max-w-[160px]">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
