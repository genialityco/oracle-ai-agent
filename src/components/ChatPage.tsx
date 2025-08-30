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
  Accordion,
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
    refTitle: 'clamp(16px, 3.4vw, 32px)',
    refText: 'clamp(14px, 3vw, 28px)',
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

  // ======= Inactividad con contador visible =======
  const IDLE_TOTAL = 10; // segundos
  const [idleLeft, setIdleLeft] = useState<number | null>(null);
  const idleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdle = () => {
    if (idleIntervalRef.current) { clearInterval(idleIntervalRef.current); idleIntervalRef.current = null; }
    if (idleTimeoutRef.current) { clearTimeout(idleTimeoutRef.current); idleTimeoutRef.current = null; }
    setIdleLeft(null);
  };

  const handleTimeout = async () => {
    try { await signOut(auth); } catch (e) { console.error('Error al cerrar sesión:', e); }
    finally { onTimeout ? onTimeout() : (window.location.href = '/'); }
  };

  const startIdleAfterLastMessage = () => {
    // No contar mientras esperamos respuesta
    if (loading) {return;}
    clearIdle();
    setIdleLeft(IDLE_TOTAL);
    // intervalo visible
    idleIntervalRef.current = setInterval(() => {
      setIdleLeft((prev) => {
        if (prev == null) {return null;}
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    // timeout final
    idleTimeoutRef.current = setTimeout(handleTimeout, IDLE_TOTAL * 1000);
  };

  // 1) Inicia/renueva el contador cada vez que llega un MENSAJE nuevo (user o bot) y no hay loading
  useEffect(() => {
    if (messages.length === 0) {return;}
    startIdleAfterLastMessage();
  }, [messages, loading]);

  // 2) Cualquier interacción del usuario CANCELA el contador (y NO redirige).
  useEffect(() => {
    const stopOnActivity = () => clearIdle();
    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, stopOnActivity, { passive: true } as any));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, stopOnActivity as any));
    };
  }, []);

  // ======= Render de referencias =======
  const renderReferences = (refs?: Array<string | RefWithMeta>) => {
    if (!refs?.length) {return null;}
    return (
      <>
        <Text mt="sm" mb="xs" style={{ fontSize: FS.refTitle, fontWeight: 700 }}>Referencias:</Text>
        <Accordion styles={{ control: { fontSize: FS.refTitle, paddingBlock: '8px' }, panel: { fontSize: FS.refText } }}>
          {refs.map((ref, idx) => {
            const isString = typeof ref === 'string';
            const key = isString ? `ref-${idx}` : (ref as RefWithMeta).id ?? `ref-${idx}`;
            const title = isString
              ? `Fragmento ${idx + 1}`
              : `${(ref as RefWithMeta).file ?? 'Documento'}${
                  (ref as RefWithMeta).page != null ? ` — pág. ${(ref as RefWithMeta).page}` : ''
                }`;
            const paragraph = isString ? (ref as string) : (ref as RefWithMeta).paragraph || '';
            return (
              <Accordion.Item value={key} key={key}>
                <Accordion.Control>{title}</Accordion.Control>
                <Accordion.Panel>
                  <Text style={{ whiteSpace: 'pre-wrap', fontSize: FS.refText }}>
                    {paragraph || (isString ? (ref as string) : 'Sin texto disponible')}
                  </Text>
                  {!isString && (ref as RefWithMeta).file_url ? (
                    <button
                      type="button"
                      onClick={() => window.open((ref as RefWithMeta).file_url!, '_blank')}
                      style={{
                        marginTop: '0.6em',
                        fontSize: FS.button,
                        padding: `${SIZE.sendPadV} ${SIZE.sendPadH}`,
                        fontWeight: 700,
                        borderRadius: SIZE.radius,
                        border: '1px solid #E0E0E0',
                        background: '#FFFFFF',
                        color: '#2F3537',
                        cursor: 'pointer',
                      }}
                    >
                      Ver documento
                    </button>
                  ) : null}
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </>
    );
  };

  // ======= Envío =======
  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) {return;}

    // Al enviar, también cancelamos cualquier countdown activo
    clearIdle();

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
      {/* ===== Encabezado: logo arriba, luego textos ===== */}
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
            const isLastBot = !isUser && i === messages.length - 1;

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
                {/* Avatar neutro SIN imagen para el bot */}
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

                  {/* Referencias */}
                  {msg.role === 'bot' && msg.references?.length ? renderReferences(msg.references) : null}

                  {/* Sugerencias del último bot */}
                  {isLastBot && lastFollow && (lastFollow.opciones?.length || lastFollow.gancho) ? (
                    <div style={{ marginTop: '0.8em' }}>
                      {lastFollow.opciones?.length ? (
                        <Group gap="xs" wrap="wrap">
                          {lastFollow.opciones.map((op) => (
                            <button
                              key={op.id}
                              type="button"
                              onClick={async () => {
                                clearIdle(); // interacción: cancela countdown
                                setMessages((prev) => [...prev, { role: 'user', content: op.titulo }]);
                                await askRag(op.query_sugerida);
                              }}
                              style={{
                                fontSize: FS.button,
                                padding: `${SIZE.sendPadV} ${SIZE.sendPadH}`,
                                fontWeight: 600,
                                borderRadius: SIZE.radius,
                                border: '1px solid #E0E0E0',
                                background: '#FFFFFF',
                                color: '#2F3537',
                                cursor: 'pointer',
                              }}
                            >
                              {op.titulo}
                            </button>
                          ))}
                        </Group>
                      ) : null}
                    </div>
                  ) : null}
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
            onChange={(e) => { setInput(e.currentTarget.value); clearIdle(); /* escribir = actividad */ }}
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
            onClick={() => { clearIdle(); sendMessage(); }}
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

      {/* ===== Banner de cuenta regresiva (solo visible si idleLeft !== null) ===== */}
      {idleLeft !== null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '14px',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: FS.countdown,
            boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
          }}
        >
          No hay actividad, cerrando sesión en {idleLeft}…
        </div>
      )}
    </Box>
  );
}
