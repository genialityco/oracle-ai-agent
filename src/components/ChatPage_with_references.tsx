/* eslint-disable no-console */
/* eslint-disable jsx-a11y/iframe-has-title */
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Accordion,
  Avatar,
  Box,
  Drawer,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Text,
  Title,
} from '@mantine/core';

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
  backgroundSrc?: string;
  logoSrc?: string;
  ragUrl?: string;
};

/** === Follow-ups === */
type FollowUpOption = {
  id: string;
  titulo: string;
  query_sugerida: string;
};

type FollowPack = {
  gancho?: string;
  opciones: FollowUpOption[];
};

export default function ChatPageOld({
  mode,
  backgroundSrc = '/fondo_2.png',
  logoSrc = '/LOGOS_GEN.iality_web-15.svg',
  ragUrl,
}: ChatProps) {
  const RAG_URL = ragUrl || ENV_RAG_URL;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [drawerOpened, setDrawerOpened] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);

  // último paquete de sugerencias devuelto por el LLM
  const [lastFollow, setLastFollow] = useState<FollowPack | null>(null);

  // --- escalas responsivas ---
  const FS = {
    headerTitle: 'clamp(28px, 4.5vw, 72px)',
    headerSubtitle: 'clamp(16px, 3.5vw, 40px)',
    bubbleText: 'clamp(16px, 4vw, 36px)',
    refTitle: 'clamp(16px, 3.4vw, 32px)',
    refText: 'clamp(14px, 3vw, 28px)',
    textarea: 'clamp(16px, 4vw, 34px)',
    button: 'clamp(18px, 4.2vw, 36px)',
  } as const;

  const SIZE = {
    avatar: 'clamp(28px, 4vw, 64px)',
    bubblePad: 'clamp(10px, 2.2vw, 22px)',
    gap: 'clamp(8px, 1.8vw, 20px)',
    sendPadV: 'clamp(10px, 1.8vw, 18px)',
    sendPadH: 'clamp(14px, 3vw, 36px)',
    radius: 'clamp(10px, 1.4vw, 16px)',
  } as const;

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  // Saludo inicial
  useEffect(() => {
    if (!hasGreeted) {
      setMessages([
        {
          role: 'bot',
          content: '¡Hola! Soy tu agente Oracle. ¿Cómo te puedo ayudar hoy?',
        },
      ]);
      setHasGreeted(true);
    }
  }, [hasGreeted]);

  /** ================== Helpers de Follow-ups ================== */

  // Pedimos al LLM que añada un bloque JSON en UNA sola línea con gancho + opciones
  const buildAIQuery = (userQ: string) => {
    return `${userQ}. Responde en español de forma clara y útil.
Incluye ejemplos si sirven y TERMINA tu texto con una pregunta breve para continuar.

Al final de tu respuesta normal, añade un BLOQUE JSON en UNA sola línea, delimitado por:
<!--JSON_START-->{...}<!--JSON_END-->

Ese JSON debe tener esta forma:
{"gancho":"Pregunta breve para continuar","opciones":[
  {"id":"pasos","titulo":"Ver pasos concretos","query_sugerida":"Muéstrame los pasos para ..."},
  {"id":"docs","titulo":"Ver documentos relacionados","query_sugerida":"Muéstrame documentos sobre ..."}
]}

Si no hay buenas opciones, usa {"gancho":"¿Quieres profundizar en algo?","opciones":[]} y NO agregues saltos de línea dentro del JSON.`;
  };

  // Extrae el JSON y devuelve el texto "limpio" + pack
  const parseFollowups = (fullAnswer: string): { clean: string; pack: FollowPack } => {
    const rx = /<!--JSON_START-->([\s\S]*?)<!--JSON_END-->/;
    const m = fullAnswer?.match?.(rx);
    if (!m) {
      return { clean: (fullAnswer || '').trim(), pack: { opciones: [] } };
    }
    let pack: FollowPack = { opciones: [] };
    try {
      const parsed = JSON.parse((m[1] || '').trim());
      pack = {
        gancho: parsed?.gancho,
        opciones: Array.isArray(parsed?.opciones) ? parsed.opciones : [],
      };
    } catch {
      pack = { opciones: [] };
    }
    const clean = (fullAnswer || '').replace(rx, '').trim();
    return { clean, pack };
  };

  // Detección simple de "sí, cuéntame más"
  const isAffirmative = (text: string) =>
    /^(sí|si|dale|ok|listo|de una|claro|perfecto|continúa|continuar|sigue|cuéntame más|cuentame mas|sí,.*|si,.*)\b/i.test(
      text.trim()
    );

  // Llama al endpoint RAG con la query enriquecida, parsea follow-ups y pinta el mensaje del bot
  const askRag = async (q: string) => {
    setLoading(true);
    try {
      if (!RAG_URL) {
        throw new Error('VITE_RAG_URL no está definida');
      }

      const { data } = await axios.post<RagQueryResponse>(`${RAG_URL}/query`, {
        query: buildAIQuery(q),
        k: 3,
        meta: { mode },
      });

      const { clean, pack } = parseFollowups(data?.answer ?? '');
      setLastFollow(pack?.opciones?.length || pack?.gancho ? pack : null);

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: clean,
          references: Array.isArray(data?.context) ? data.context : [],
        },
      ]);
    } catch (error: any) {
      console.error('RAG error:', error?.message || error);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'No pude procesar tu pregunta. Revisa la URL del servicio RAG.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /** ================== Flujo de envío ================== */

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) {
      return;
    }

    // Mostrar el mensaje del usuario
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');

    // Si es un "sí..." y hay opciones, dispara la más relevante (o la primera)
    if (isAffirmative(q) && lastFollow?.opciones?.length) {
      const chosen =
        lastFollow.opciones.find((op) => new RegExp(op.titulo, 'i').test(q)) ||
        lastFollow.opciones[0];

      // mostramos la intención elegida como mensaje del usuario
      setMessages((prev) => [...prev, { role: 'user', content: chosen.titulo }]);
      await askRag(chosen.query_sugerida);
      return;
    }

    // Caso normal: preguntar al RAG
    await askRag(q);
  };

  /** ================== UI de referencias ================== */

  const openPdf = (url: string) => {
    setPdfUrl(url);
    setDrawerOpened(true);
  };

  const renderReferences = (refs: Array<string | RefWithMeta>) => {
    if (!refs?.length) {
      return null;
    }
    return (
      <>
        <Text mt="sm" mb="xs" style={{ fontSize: FS.refTitle, fontWeight: 700 }}>
          Referencias:
        </Text>
        <Accordion
          styles={{
            control: { fontSize: FS.refTitle, paddingBlock: '8px' },
            panel: { fontSize: FS.refText },
          }}
        >
          {refs.map((ref, idx) => {
            const isString = typeof ref === 'string';
            const key = isString ? `ref-${idx}` : ((ref as RefWithMeta).id ?? `ref-${idx}`);
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
                      onClick={() => openPdf((ref as RefWithMeta).file_url!)}
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

  /** ================== Render ================== */

  const bg = backgroundSrc ? `url('${backgroundSrc}') center / cover no-repeat` : undefined;

  return (
    <Box
      component="section"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* Header */}
      <Box pl={80} pt={150} pb={8}>
        <Title order={2} style={{ margin: 0, lineHeight: 1.1, fontSize: FS.headerTitle }}>
          {mode === 'agente' ? 'Agente AI' : 'Uso de Agente AI'}
        </Title>
        <Text style={{ fontSize: FS.headerSubtitle, opacity: 0.9 }}>
          Haz tu pregunta y te respondo con contexto.
        </Text>
      </Box>

      {/* Mensajes */}
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
              >
                {!isUser && (
                  <Avatar
                    radius="xl"
                    src={logoSrc}
                    alt="bot"
                    style={{
                      width: SIZE.avatar as any,
                      height: SIZE.avatar as any,
                      marginTop: 4,
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

                  {/* Sugerencias (solo bajo el ÚLTIMO mensaje del bot) */}
                  {isLastBot && lastFollow && (lastFollow.opciones?.length || lastFollow.gancho) ? (
                    <div style={{ marginTop: '0.8em' }}>
                      {lastFollow.opciones?.length ? (
                        <Group gap="xs" wrap="wrap">
                          {lastFollow.opciones.map((op) => (
                            <button
                              key={op.id}
                              type="button"
                              onClick={async () => {
                                setMessages((prev) => [
                                  ...prev,
                                  { role: 'user', content: op.titulo },
                                ]);
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

                  {msg.role === 'bot' && Array.isArray(msg.references) && msg.references.length > 0
                    ? renderReferences(msg.references)
                    : null}
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

      {/* Input fijo abajo – HTML nativo */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
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
          {/* textarea nativo */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
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
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          {/* botón nativo */}
          <button
            type="button"
            onClick={sendMessage}
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

      {/* Drawer PDF (Mantine) */}
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title={<span style={{ fontSize: FS.headerSubtitle, fontWeight: 700 }}>Documento</span>}
        size="xl"
        padding="xl"
      >
        <iframe src={pdfUrl} style={{ border: 'none', width: '100%', height: '78vh' }} />
      </Drawer>
    </Box>
  );
}
