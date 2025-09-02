/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable no-console */
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Text,
  Title,
} from '@mantine/core';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

type ChatMode = 'agente' | 'uso';

type RefWithMeta = {
  id?: string;
  file?: string;
  page?: number;
  paragraph?: string;
  file_url?: string;
  score?: number;
};

interface Message {
  role: 'user' | 'bot';
  content: string;
  references?: Array<string | RefWithMeta>;
}

type RagQueryResponse = {
  context: string[];
  answer: string;
};

const ENV_RAG_URL = import.meta.env.VITE_RAG_URL as string | undefined;

type ChatProps = {
  mode: ChatMode;
  ragUrl?: string;
  onTimeout?: () => void;
};

type FollowUpOption = { id: string; titulo: string; query_sugerida: string };
type FollowPack = { gancho?: string; opciones: FollowUpOption[] };

export default function ChatPage({ mode, ragUrl, onTimeout }: ChatProps) {
  const RAG_URL = ragUrl || ENV_RAG_URL;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [lastFollow, setLastFollow] = useState<FollowPack | null>(null);

  // ======= Tipografías / tamaños =======
  const FS = {
    headerTitle: 'clamp(28px, 4.5vw, 72px)',
    headerSubtitle: 'clamp(16px, 3.5vw, 40px)',
    bubbleText: 'clamp(16px, 4vw, 36px)',
    textarea: 'clamp(16px, 4vw, 34px)',
    button: 'clamp(18px, 4.2vw, 36px)',
    countdown: 'clamp(14px, 3.2vw, 28px)',
  } as const;

  const SIZE = {
    bubblePad: 'clamp(10px, 2.2vw, 22px)',
    gap: 'clamp(8px, 1.8vw, 20px)',
    sendPadV: 'clamp(10px, 1.8vw, 18px)',
    sendPadH: 'clamp(14px, 3vw, 36px)',
    radius: 'clamp(10px, 1.4vw, 16px)',
    botDot: 'clamp(20px, 3.6vw, 40px)',
  } as const;

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  // ======= Saludo inicial =======
  useEffect(() => {
    if (!hasGreeted) {
      setMessages([{ role: 'bot', content: '¡Hola! Soy tu agente Oracle. ¿Cómo te puedo ayudar hoy?' }]);
      setHasGreeted(true);
    }
  }, [hasGreeted]);

  // ======= Follow-ups =======
  const buildAIQuery = (userQ: string) => `${userQ}. Responde en español de forma clara y útil.
Incluye ejemplos si sirven y TERMINA tu texto con una pregunta breve para continuar.

Al final de tu respuesta normal, añade un BLOQUE JSON en UNA sola línea, delimitado por:
<!--JSON_START-->{...}<!--JSON_END-->

Ese JSON debe tener esta forma:
{"gancho":"Pregunta breve para continuar","opciones":[
  {"id":"pasos","titulo":"Ver pasos concretos","query_sugerida":"Muéstrame los pasos para ..."},
  {"id":"docs","titulo":"Ver documentos relacionados","query_sugerida":"Muéstrame documentos sobre ..."}
]}

Si no hay buenas opciones, usa {"gancho":"¿Quieres profundizar en algo?","opciones":[]} y NO agregues saltos de línea dentro del JSON.`;

  const parseFollowups = (fullAnswer: string): { clean: string; pack: FollowPack } => {
    const rx = /<!--JSON_START-->([\s\S]*?)<!--JSON_END-->/;
    const m = fullAnswer?.match?.(rx);
    if (!m) {return { clean: (fullAnswer || '').trim(), pack: { opciones: [] } };}
    let pack: FollowPack = { opciones: [] };
    try {
      const parsed = JSON.parse((m[1] || '').trim());
      pack = { gancho: parsed?.gancho, opciones: Array.isArray(parsed?.opciones) ? parsed.opciones : [] };
    } catch {
      pack = { opciones: [] };
    }
    return { clean: (fullAnswer || '').replace(rx, '').trim(), pack };
  };

  const isAffirmative = (text: string) =>
    /^(sí|si|dale|ok|listo|de una|claro|perfecto|continúa|continuar|sigue|cuéntame más|cuentame mas|sí,.*|si,.*)\b/i.test(
      text.trim()
    );

  const askRag = async (q: string) => {
    setLoading(true);
    try {
      if (!RAG_URL) {throw new Error('VITE_RAG_URL no está definida');}
      const { data } = await axios.post<RagQueryResponse>(`${RAG_URL}/query`, {
        query: buildAIQuery(q),
        k: 3,
        meta: { mode },
      });
      const { clean, pack } = parseFollowups(data?.answer ?? '');
      setLastFollow(pack?.opciones?.length || pack?.gancho ? pack : null);
      setMessages((prev) => [...prev, { role: 'bot', content: clean, references: Array.isArray(data?.context) ? data.context : [] }]);
    } catch (error: any) {
      console.error('RAG error:', error?.message || error);
      setMessages((prev) => [...prev, { role: 'bot', content: 'No pude procesar tu pregunta. Revisa la URL del servicio RAG.' }]);
    } finally {
      setLoading(false);
    }
  };

  // ======= Inactividad: dos fases controladas por interacción global =======
  // Fase 1: 10s sin interacción => mostrar overlay de redirección (fase 2).
  // Fase 2: overlay visible con cuenta 10..0 => signOut + redirect si llega a 0.
  type IdlePhase = 'idle' | 'redirect' | 'off';
  const [idlePhase, setIdlePhase] = useState<IdlePhase>('off');
  const [redirectLeft, setRedirectLeft] = useState<number>(10);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllIdle = () => {
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    if (redirectTimerRef.current) { clearTimeout(redirectTimerRef.current); redirectTimerRef.current = null; }
    if (redirectIntervalRef.current) { clearInterval(redirectIntervalRef.current); redirectIntervalRef.current = null; }
    setIdlePhase('off');
  };

  const startIdlePhase1 = () => {
    // comienza a contar 10s desde la última interacción
    if (idleTimerRef.current) {clearTimeout(idleTimerRef.current);}
    setIdlePhase('idle');
    idleTimerRef.current = setTimeout(() => {
      // pasa a fase de redirección
      startRedirectPhase();
    }, 120_000);
  };

  const startRedirectPhase = () => {
    // muestra overlay con countdown 10..0
    setIdlePhase('redirect');
    setRedirectLeft(10);
    if (redirectIntervalRef.current) {clearInterval(redirectIntervalRef.current);}
    if (redirectTimerRef.current) {clearTimeout(redirectTimerRef.current);}

    redirectIntervalRef.current = setInterval(() => {
      setRedirectLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    redirectTimerRef.current = setTimeout(async () => {
      try { await signOut(auth); } catch (e) { console.error('Error al cerrar sesión:', e); }
      finally { onTimeout ? onTimeout() : (window.location.href = '/'); }
    }, 10_000);
  };

  // Acción global de actividad: resetea a fase 1 (y oculta overlay si estaba)
  const onAnyActivity = () => {
    // Solo respondemos a click/touch/keydown (no mousemove/scroll)
    clearAllIdle();
    startIdlePhase1();
  };

  // Listeners globales
  useEffect(() => {
    const onClick = () => onAnyActivity();
    const onKey = () => onAnyActivity();
    const onTouch = () => onAnyActivity();

    window.addEventListener('click', onClick, { passive: true } as any);
    window.addEventListener('keydown', onKey as any);
    window.addEventListener('touchstart', onTouch, { passive: true } as any);

    // Al entrar a la pantalla: empezar a contar 10s
    startIdlePhase1();

    return () => {
      window.removeEventListener('click', onClick as any);
      window.removeEventListener('keydown', onKey as any);
      window.removeEventListener('touchstart', onTouch as any);
      clearAllIdle();
    };
  }, []);

  // ======= Envío =======
  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) {return;}

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');

    if (isAffirmative(q) && lastFollow?.opciones?.length) {
      const chosen =
        lastFollow.opciones.find((op) => new RegExp(op.titulo, 'i').test(q)) || lastFollow.opciones[0];
      setMessages((prev) => [...prev, { role: 'user', content: chosen.titulo }]);
      await askRag(chosen.query_sugerida);
      return;
    }
    await askRag(q);
  };

  return (
    <Box
      component="section"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        background: "url('/fondo_chat.png') center / cover no-repeat",
        display: 'flex',
        flexDirection: 'column',
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* ===== Encabezado ===== */}
      <Box pt={40} pl={80} pr={20}>
        <img
          src="/logo_bo25b.png"
          alt="Logo"
          style={{ height: 'clamp(48px, 8vw, 120px)', width: 'auto', objectFit: 'contain' }}
        />
        <Box mt={20} mb={8}>
          <Title order={2} style={{ margin: 0, lineHeight: 1.1, fontSize: FS.headerTitle }}>
            {mode === 'agente' ? 'Agente AI' : 'Uso de Agente AI'}
          </Title>
          <Text style={{ fontSize: FS.headerSubtitle, opacity: 0.9 }}>
            Haz tu pregunta y te respondo con contexto.
          </Text>
        </Box>
      </Box>

      {/* ===== Mensajes ===== */}
      <ScrollArea style={{ flex: 1, padding: '0 12px' }}>
        <Box pb={8}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <Group
                key={i}
                justify={isUser ? 'flex-end' : 'flex-start'}
                align="flex-start"
                wrap="nowrap"
                mb="sm"
                gap={SIZE.gap as any}
                pl={isUser ? 0 : 4}
              >
                {/* Punto neutro (sin imagen) para bot */}
                {!isUser && (
                  <div
                    aria-hidden
                    style={{
                      width: SIZE.botDot as any,
                      height: SIZE.botDot as any,
                      borderRadius: '999px',
                      background: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.1)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                      marginTop: 4,
                      flex: '0 0 auto',
                    }}
                  />
                )}

                <Paper
                  shadow="sm"
                  radius="md"
                  style={{
                    maxWidth: '85%',
                    background: isUser ? '#2F3537' : '#FFFFFF',
                    color: isUser ? '#FFFFFF' : '#2F3537',
                    padding: SIZE.bubblePad,
                  }}
                >
                  <Text style={{ whiteSpace: 'pre-wrap', fontSize: FS.bubbleText }}>
                    {msg.content}
                  </Text>
                </Paper>
              </Group>
            );
          })}

          {loading && (
            <Group gap="xs">
              <Loader size="lg" />
              <Text style={{ fontSize: FS.bubbleText }}>Cargando respuesta…</Text>
            </Group>
          )}

          <div ref={endRef} />
        </Box>
      </ScrollArea>

      {/* ===== Input fijo abajo ===== */}
      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        style={{
          position: 'sticky',
          bottom: 0,
          background:
            'linear-gradient(180deg, rgba(47,53,55,0) 0%, rgba(47,53,55,0.55) 20%, rgba(47,53,55,0.85) 100%)',
          backdropFilter: 'blur(4px)',
          padding: '10px 12px 14px',
        }}
      >
        <Group align="flex-end" gap={SIZE.gap as any}>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.currentTarget.value); onAnyActivity(); }}
            placeholder="Escribe tu mensaje y presiona Enter…"
            rows={1}
            style={{
              flex: 1,
              resize: 'vertical',
              fontSize: FS.textarea,
              lineHeight: 1.35,
              padding: 'clamp(10px, 2vw, 22px)',
              borderRadius: SIZE.radius,
              border: '1px solid rgba(0,0,0,0.2)',
              outline: 'none',
              background: '#fff',
              color: '#2F3537',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
          />
          <button
            type="button"
            onClick={() => { onAnyActivity(); sendMessage(); }}
            disabled={loading}
            style={{
              fontSize: FS.button,
              padding: `${SIZE.sendPadV} ${SIZE.sendPadH}`,
              fontWeight: 700,
              borderRadius: SIZE.radius,
              border: 'none',
              background: '#F1F1F1',
              color: '#2F3537',
              boxShadow: '0 1px 0 rgba(0,0,0,0.15)',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            Enviar
          </button>
        </Group>
      </Box>

      {/* ===== Overlay de inactividad (solo fase redirect) ===== */}
      {idlePhase === 'redirect' && (
        <div
          role="dialog"
          aria-live="polite"
          aria-modal="true"
          tabIndex={-1}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={onAnyActivity}
          onKeyDown={(e) => { if (e.key) {onAnyActivity();} }}
          onTouchStart={onAnyActivity}
        >
          <div
            style={{
              background: '#111',
              color: '#fff',
              padding: '22px 26px',
              borderRadius: 16,
              boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
              textAlign: 'center',
              maxWidth: 560,
            }}
          >
            <h3 style={{ margin: 0, fontSize: FS.headerSubtitle, fontWeight: 800 }}>
              Inactividad detectada
            </h3>
            <p style={{ margin: '10px 0 0', fontSize: FS.countdown }}>
              Serás redirigido al inicio en <strong>{redirectLeft}</strong> segundos…
            </p>
            <p style={{ margin: '10px 0 0', fontSize: FS.countdown, opacity: 0.9 }}>
              Toca, haz clic o presiona una tecla para continuar.
            </p>
          </div>
        </div>
      )}
    </Box>
  );
}
