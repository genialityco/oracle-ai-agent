/* eslint-disable no-console */
/* eslint-disable no-empty */
import { useEffect, useMemo, useState } from 'react';
import { SURVEY, type Question } from '../surveySchema.es';
import { SURVEY_EN } from '../surveySchema.en';
import { ensureAnonAuth, saveSurveyResponse } from '@/lib/firebaseClient';

type Props = { onSubmit?: (answers: Record<string, string>) => void; backgroundSrc?: string };
const DRAFT_KEY = 'encuestaDraftV1';

// --- Textos de UI por idioma ---
const UI = {
  es: {
    title: 'Empecemos con tus datos',
    subtitle: 'Solo tomará un momento.',
    progress: (a: number, t: number) => `Progreso: ${a}/${t}`,
    section: (i: number, total: number) => `Sección ${i} de ${total}`,
    prev: 'Anterior',
    next: 'Siguiente',
    submitIdle: 'Enviar respuestas',
    submitSaving: 'Guardando…',
    errTitle: 'Respuestas faltantes',
    errBody: 'Por favor completa las preguntas marcadas antes de continuar.',
    selectOne: 'Selecciona una opción.',
    longPlaceholder: 'Escribe tu respuesta…',
  },
  en: {
    title: `Let’s start with your info`,
    subtitle: `It will only take a moment.`,
    progress: (a: number, t: number) => `Progress: ${a}/${t}`,
    section: (i: number, total: number) => `Section ${i} of ${total}`,
    prev: 'Back',
    next: 'Next',
    submitIdle: 'Submit answers',
    submitSaving: 'Saving…',
    errTitle: 'Missing answers',
    errBody: 'Please complete the marked questions before continuing.',
    selectOne: 'Select an option.',
    longPlaceholder: 'Type your answer…',
  },
} as const;

// --- Detección de idioma simple ---
const pickLocale = (locale?: string): 'es' | 'en' =>
  (locale ?? '').toLowerCase().startsWith('en') ? 'es' : 'en';

export default function EncuestaPage({ onSubmit, backgroundSrc = '/fondo_home.png' }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, true>>({});
  const [uid, setUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // --- idioma detectado en cliente + esquema activo ---
  const [locale, setLocale] = useState<'es' | 'en'>('en');
  const SURVEY_ACTIVE: Question[] = useMemo(
    () => (locale === 'es' ? SURVEY : SURVEY_EN),
    [locale]
  );
  const T = UI[locale];

  useEffect(() => {
    const lang = (navigator.languages?.[0]) || navigator.language || 'es';
    setLocale(pickLocale(lang));
  }, []);

  // Auth anónima para poder guardar
  useEffect(() => {
    (async () => {
      try {
        const user = await ensureAnonAuth();
        setUid(user.uid);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of SURVEY_ACTIVE) {
      (map.get(q.section) ?? map.set(q.section, []).get(q.section)!).push(q);
    }
    return Array.from(map.entries());
  }, [SURVEY_ACTIVE]);

  // draft local
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { setAnswers(JSON.parse(raw)); }
    } catch { }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    } catch { }
  }, [answers]);

  const required = (q: Question) => q.type !== 'long_text';
  const totalRequired = SURVEY_ACTIVE.filter(required).length;
  const answeredRequired = SURVEY_ACTIVE.filter(required).reduce(
    (acc, q) => acc + (answers[q.id]?.trim() ? 1 : 0),
    0
  );
  const progress = Math.round((answeredRequired / totalRequired) * 100);

  const handle = (id: string, value: string) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    if (errors[id]) {
      const { [id]: _omit, ...rest } = errors;
      setErrors(rest);
    }
  };

  const validateSection = (index: number) => {
    const [, qs] = sections[index];
    const missing = qs.filter((q) => required(q) && !answers[q.id]);
    if (!missing.length) { setErrors({}); return true; }
    const next: Record<string, true> = {};
    missing.forEach((q) => (next[q.id] = true));
    setErrors(next);
    return false;
  };

  const next = () => {
    if (validateSection(step)) { setStep((s) => Math.min(s + 1, sections.length - 1)); }
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!validateSection(step)) { return; }
    try {
      setSaving(true);
      const userId = uid ?? (await ensureAnonAuth()).uid;
      await saveSurveyResponse({
        uid: userId,
        answers,
        progress: 100,
        step,
        totalSections: sections.length,
        completed: true,
      });
      onSubmit?.(answers);
      try { localStorage.removeItem(DRAFT_KEY); } catch { }
    } finally {
      setSaving(false);
    }
  };

  const bg = `url('${backgroundSrc}') center / cover no-repeat`;

  // ---------- estilos base (HTML nativo) ----------
  const pageStyle: React.CSSProperties = {
    position: 'relative',
    minHeight: '100dvh',
    width: '100%',
    background: bg,
    color: '#FFFFFF',
    padding:
      'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
  };

  const headerWrap: React.CSSProperties = {
    padding: 'clamp(40px, 8vmin, 120px) clamp(16px, 5vmin, 120px) 0',
    textShadow: '0 1px 1px rgba(0,0,0,0.5)',
    maxWidth: 'min(92vw, 1100px)',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontWeight: 800,
    lineHeight: 1.04,
    fontSize: 'clamp(30px, 7.2vmin, 70px)',
  };

  const subtitleStyle: React.CSSProperties = {
    marginTop: 'clamp(6px, 1vmin, 12px)',
    opacity: 0.92,
    fontSize: 'clamp(16px, 3.2vmin, 40px)',
  };

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 'clamp(10px, 2vmin, 22px)',
    marginRight: 'clamp(12px, 4vmin, 48px)',
    fontSize: 'clamp(12px, 2.4vmin, 28px)',
    opacity: 0.9,
  };

  const progressBarWrap: React.CSSProperties = {
    marginTop: 'clamp(8px, 1.2vmin, 14px)',
    width: '100%',
    height: 'clamp(10px, 1.6vmin, 18px)',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  };
  const progressBarFill: React.CSSProperties = {
    width: `${progress}%`,
    height: '100%',
    background: '#FFD84D',
  };

  const cardStyle: React.CSSProperties = {
    margin: 'clamp(10px, 2vmin, 20px) clamp(16px, 5vmin, 120px) clamp(40px, 6vmin, 80px)',
    padding: 'clamp(14px, 2.2vmin, 26px) clamp(16px, 2.6vmin, 30px)',
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    color: '#2F3537',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    maxWidth: 'min(92vw, 1100px)',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    margin: 0,
    marginBottom: 'clamp(8px, 1.4vmin, 16px)',
    fontSize: 'clamp(18px, 3.2vmin, 40px)',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: 'clamp(16px, 3.2vmin, 40px)',
    lineHeight: 1.25,
    marginBottom: 'clamp(6px, 1vmin, 12px)',
  };

  const helpErrorStyle: React.CSSProperties = {
    marginTop: 'clamp(4px, 0.8vmin, 10px)',
    color: '#c92a2a',
    fontSize: 'clamp(12px, 2.2vmin, 26px)',
  };

  const chipRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'clamp(8px, 1.4vmin, 14px)',
  };

  const chipBase: React.CSSProperties = {
    padding: 'clamp(8px, 1.6vmin, 16px) clamp(12px, 2.2vmin, 22px)',
    fontSize: 'clamp(14px, 2.8vmin, 34px)',
    fontWeight: 700,
    background: '#fff',
    color: '#2F3537',
    cursor: 'pointer',
    marginLeft: '5px',
  border: '1px solid #D1D5DB',
  } as React.CSSProperties;

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 'clamp(90px, 16vmin, 200px)',
    fontSize: 'clamp(14px, 2.6vmin, 32px)',
    lineHeight: 1.4,
    padding: 'clamp(10px, 1.6vmin, 18px)',
    borderRadius: 12,
    border: '1px solid #D1D5DB',
    outline: 'none',
    resize: 'vertical',
  };

  const actionsRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 'clamp(10px, 2vmin, 24px)',
    marginTop: 'clamp(14px, 2.2vmin, 28px)',
    flexWrap: 'wrap',
  };

  const btnSecondary: React.CSSProperties = {
    background: '#FFFFFF',
    color: '#2F3537',
    border: '1px solid #D1D5DB',
    borderRadius: 'clamp(8px, 1.2vmin, 14px)',
    fontWeight: 800,
    fontSize: 'clamp(14px, 2.8vmin, 34px)',
    padding: 'clamp(10px, 2vmin, 20px) clamp(16px, 3vmin, 32px)',
    cursor: 'pointer',
  };

  const btnPrimary: React.CSSProperties = {
    background: '#FFD84D',
    color: '#121212',
    border: 'none',
    borderRadius: 'clamp(10px, 1.4vmin, 16px)',
    fontWeight: 900,
    fontSize: 'clamp(14px, 2.8vmin, 34px)',
    padding: 'clamp(10px, 2vmin, 20px) clamp(16px, 3vmin, 32px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.22)',
    cursor: 'pointer',
  };

  // -------- RENDER nativo --------
  const renderLikert = (q: Extract<Question, { type: 'likert_1_5' }>) => (
    <div key={q.id} style={{ marginBottom: 'clamp(10px, 2vmin, 20px)' }}>
      <label style={labelStyle}>{q.text}</label>
      <div role="group" aria-label={q.text} style={chipRow}>
        {['1', '2', '3', '4', '5'].map((v) => {
          const active = answers[q.id] === v;
          return (
            <button
              key={v}
              type="button"
              style={{
                ...chipBase,
                background: active ? '#2F3537' : '#fff',
                color: active ? '#fff' : '#2F3537',
                borderColor: active ? '#2F3537' : '#D1D5DB',
              }}
              aria-pressed={active}
              onClick={() => handle(q.id, v)}
            >
              {v}
            </button>
          );
        })}
      </div>
      {errors[q.id] && <div style={helpErrorStyle}>{T.selectOne}</div>}
    </div>
  );

  const renderSingle = (q: Extract<Question, { type: 'single_choice' }>) => (
    <div key={q.id} style={{ marginBottom: 'clamp(10px, 2vmin, 20px)' }}>
      <label style={labelStyle}>{q.text}</label>
      <div role="group" aria-label={q.text} style={chipRow}>
        {q.options.map((opt) => {
          const active = answers[q.id] === opt;
          return (
            <button
              key={opt}
              type="button"
              style={{
                ...chipBase,
                background: active ? '#2F3537' : '#fff',
                color: active ? '#fff' : '#2F3537',
                borderColor: active ? '#2F3537' : '#D1D5DB',
              }}
              aria-pressed={active}
              onClick={() => handle(q.id, opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {errors[q.id] && <div style={helpErrorStyle}>{T.selectOne}</div>}
    </div>
  );

  const renderLong = (q: Extract<Question, { type: 'long_text' }>) => (
    <div key={q.id} style={{ marginBottom: 'clamp(10px, 2vmin, 20px)' }}>
      <label style={labelStyle}>{q.text}</label>
      <textarea
        value={answers[q.id] ?? ''}
        onChange={(e) => handle(q.id, e.currentTarget.value)}
        placeholder={T.longPlaceholder}
        style={textareaStyle}
      />
    </div>
  );

  return (
    <section style={pageStyle}>
      {/* Encabezado + progreso */}
      <div style={headerWrap}>
        <h1 style={titleStyle}>{T.title}</h1>
        <p style={subtitleStyle}>{T.subtitle}</p>

        <div style={metaRowStyle}>
          <span>{T.progress(answeredRequired, totalRequired)}</span>
          <span>{T.section(step + 1, sections.length)}</span>
        </div>
        <div style={progressBarWrap}>
          <div style={progressBarFill} />
        </div>
      </div>

      {/* Tarjeta de sección */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>{sections[step][0]}</h2>

        <div style={{ display: 'grid', gap: 'clamp(12px, 2.2vmin, 28px)' }}>
          {sections[step][1].map((q) =>
            q.type === 'single_choice'
              ? renderSingle(q)
              : q.type === 'likert_1_5'
                ? renderLikert(q)
                : renderLong(q)
          )}
        </div>

        <hr style={{ margin: 'clamp(12px, 2vmin, 22px) 0', border: 0, borderTop: '1px solid #E5E7EB' }} />

        <div style={actionsRow}>
          <button type="button" onClick={prev} disabled={step === 0} style={{ ...btnSecondary, opacity: step === 0 ? 0.6 : 1 }}>
            {T.prev}
          </button>

          {step < sections.length - 1 ? (
            <button type="button" onClick={next} style={btnPrimary}>
              {T.next}
            </button>
          ) : (
            <button type="button" onClick={submit} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? T.submitSaving : T.submitIdle}
            </button>
          )}
        </div>

        {Object.keys(errors).length > 0 && (
          <div
            role="alert"
            style={{
              marginTop: 'clamp(12px, 2vmin, 24px)',
              background: '#fff5f5',
              border: '1px solid #ffc9c9',
              color: '#c92a2a',
              borderRadius: 12,
              padding: 'clamp(10px, 1.6vmin, 18px)',
              fontSize: 'clamp(12px, 2.2vmin, 26px)',
              fontWeight: 600,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 'clamp(13px, 2.4vmin, 28px)' }}>
              {T.errTitle}
            </div>
            {T.errBody}
          </div>
        )}
      </div>
    </section>
  );
}
