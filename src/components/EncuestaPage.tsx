import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Group,
  Progress,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { SURVEY, type Question } from '../surveySchema';

type Props = { onSubmit?: (answers: Record<string, string>) => void; backgroundSrc?: string };
const DRAFT_KEY = 'encuestaDraftV1';

export default function EncuestaPage({ onSubmit, backgroundSrc = '/fondo_2.png' }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, true>>({});

  const sections = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of SURVEY) {(map.get(q.section) ?? map.set(q.section, []).get(q.section)!).push(q);}
    return Array.from(map.entries());
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {setAnswers(JSON.parse(raw));}
    } catch { /* empty */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    } catch { /* empty */ }
  }, [answers]);

  const required = (q: Question) => q.type !== 'long_text';
  const totalRequired = SURVEY.filter(required).length;
  const answeredRequired = SURVEY.filter(required).reduce(
    (acc, q) => acc + (answers[q.id]?.trim() ? 1 : 0),
    0
  );
  const progress = Math.round((answeredRequired / totalRequired) * 100);

  const handle = (id: string, value: string) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    if (errors[id]) {
      const { [id]: _, ...rest } = errors;
      setErrors(rest);
    }
  };

  const validateSection = (index: number) => {
    const [, qs] = sections[index];
    const missing = qs.filter((q) => required(q) && !answers[q.id]);
    if (!missing.length) {
      setErrors({});
      return true;
    }
    const next: Record<string, true> = {};
    missing.forEach((q) => (next[q.id] = true));
    setErrors(next);
    return false;
  };

  const next = () => {
    if (validateSection(step)) {setStep((s) => Math.min(s + 1, sections.length - 1));}
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const submit = () => {
    if (!validateSection(step)) {return;}
    onSubmit?.(answers);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch { /* empty */ }
  };

  const bg = `url('${backgroundSrc}') center / cover no-repeat`;

  // ---------- RENDER FUNCTIONS (no componentes) ----------
  const renderLikert = (q: Extract<Question, { type: 'likert_1_5' }>) => (
    <Stack key={q.id} gap={6}>
      <Text style={{ fontWeight: 600 }}>
        {q.text}{' '}
      </Text>
      <Chip.Group value={answers[q.id] ?? ''} onChange={(v) => handle(q.id, String(v))}>
        <Group gap="xs">
          {['1', '2', '3', '4', '5'].map((v) => (
            <Chip key={v} value={v} radius="md" variant="light">
              {v}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
      {errors[q.id] && (
        <Text size="xs" c="red.7">
          Selecciona una opción.
        </Text>
      )}
    </Stack>
  );

  const renderSingle = (q: Extract<Question, { type: 'single_choice' }>) => (
    <Stack key={q.id} gap={6}>
      <Text style={{ fontWeight: 600 }}>
        {q.text}{' '}
      </Text>
      <Chip.Group value={answers[q.id] ?? ''} onChange={(v) => handle(q.id, String(v))}>
        <Group gap="xs">
          {q.options.map((opt) => (
            <Chip key={opt} value={opt} radius="md" variant="light">
              {opt}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
      {errors[q.id] && (
        <Text size="xs" c="red.7">
          Selecciona una opción.
        </Text>
      )}
    </Stack>
  );

  const renderLong = (q: Extract<Question, { type: 'long_text' }>) => (
    <Stack key={q.id} gap={6}>
      <Text style={{ fontWeight: 600 }}>{q.text}</Text>
      <Textarea
        autosize
        minRows={3}
        value={answers[q.id] ?? ''}
        onChange={(e) => handle(q.id, e.currentTarget.value)}
        placeholder="Escribe tu respuesta…"
      />
    </Stack>
  );
  // ------------------------------------------------------

  return (
    <Box
      component="section"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        background: bg,
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        color: '#fff',
      }}
    >
      {/* Encabezado + progreso */}
      <Box style={{ padding: '56px 18px 0' }}>
        <Title
          order={1}
          style={{ lineHeight: 1.15, margin: 0, fontSize: 'clamp(22px, 5.2vw, 34px)' }}
        >
          Empecemos con tus datos
        </Title>
        <Text style={{ opacity: 0.9, marginTop: 6 }}>Solo tomará un momento.</Text>
        <Box style={{ marginTop: 12, marginRight: 18 }}>
          <Group gap="sm" justify="space-between" align="center">
            <Text size="sm" c="gray.2">
              Progreso: {answeredRequired}/{totalRequired}
            </Text>
            <Text size="sm" c="gray.2">
              Sección {step + 1} de {sections.length}
            </Text>
          </Group>
          <Progress value={progress} mt={6} />
        </Box>
      </Box>

      {/* Tarjeta de sección */}
      <Box
        style={{
          margin: '16px 18px 96px',
          padding: 16,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 14,
          color: '#2F3537',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}
      >
        <Text style={{ fontWeight: 800, marginBottom: 8 }}>{sections[step][0]}</Text>

        <Stack gap="md">
          {sections[step][1].map((q) =>
            q.type === 'single_choice'
              ? renderSingle(q)
              : q.type === 'likert_1_5'
                ? renderLikert(q)
                : renderLong(q)
          )}
        </Stack>

        <Divider my="md" />

        <Group justify="space-between">
          <Button variant="default" onClick={prev} disabled={step === 0}>
            Anterior
          </Button>
          {step < sections.length - 1 ? (
            <Button
              onClick={next}
              style={{ background: '#2F3537', color: '#fff', fontWeight: 700 }}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={submit}
              style={{ background: '#2F3537', color: '#fff', fontWeight: 700 }}
            >
              Enviar respuestas
            </Button>
          )}
        </Group>

        {Object.keys(errors).length > 0 && (
          <Alert color="red" mt="md" variant="light" title="Respuestas faltantes">
            Por favor completa las preguntas marcadas antes de continuar.
          </Alert>
        )}
      </Box>

      {/* Barra fija inferior */}
      <Box
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '10px 16px',
          background:
            'linear-gradient(180deg, rgba(47,53,55,0) 0%, rgba(47,53,55,0.75) 24%, rgba(47,53,55,0.95) 100%)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Group justify="space-between" align="center">
          <Text size="sm" c="gray.1">
            {progress}% completo
          </Text>
          <Progress value={progress} w={160} />
        </Group>
      </Box>
    </Box>
  );
}
