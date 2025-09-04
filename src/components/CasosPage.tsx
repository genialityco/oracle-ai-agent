/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
// src/components/CasosPage.tsx
import { useEffect, useRef, useState } from 'react';
import { Box, Group, Text } from '@mantine/core';

type Caso = { nombre: string; url: string };

type Lang = 'es' | 'en';

type Props = {
  onMenu?: () => void; // ← volver al menú
  onRestart?: () => void; // ← cerrar sesión + volver al inicio
  casos?: Caso[];
  lang?: Lang; // ← NUEVO
};

const CASOS_DEF: Caso[] = [
  { nombre: 'TECH', url: 'https://galaxiaglamour.com' },
  { nombre: 'Concepto Movil - APPS', url: 'https://tu-dominio/casos/concepto-apps' },
  { nombre: 'Concepto Movil - TECH', url: 'https://tu-dominio/casos/concepto-tech' },
  { nombre: 'DeAcero', url: 'https://tu-dominio/casos/deacero' },
  { nombre: 'Flecha Amarilla', url: 'https://tu-dominio/casos/flecha-amarilla' },
  { nombre: 'GNP', url: 'https://tu-dominio/casos/gnp' },
  { nombre: 'Kosmos', url: 'https://tu-dominio/casos/kosmos' },
  { nombre: 'Metalsa', url: 'https://tu-dominio/casos/metalsa' },
  { nombre: 'Waldo’s', url: 'https://tu-dominio/casos/waldos' },
  {
    nombre: 'Crédito Maestro (Financiera Maestra)',
    url: 'https://tu-dominio/casos/credito-maestro',
  },
];

/* =======================
   DICCIONARIO DE TEXTOS
   ======================= */
const LABELS = {
  es: {
    logoAlt: 'Logo',
    // Título (mantengo <br/> con el mismo layout)
    title: (
      <>
        Conoce los casos
        <br />
        de éxito con AI
        <br />
        en México
      </>
    ),
    openCaseAria: (n: string) => `Abrir caso: ${n}`,
    overlayAria: (n: string) => `Caso: ${n}`,
    close: 'Cerrar',
    menu: 'Menú',
    restart: 'Reiniciar',
    idleTitle: 'Inactividad detectada',
    idleMsg1: (s: number) => (
      <>
        Serás redirigido al inicio en <strong>{s}</strong> segundos…
      </>
    ),
    idleMsg2: 'Toca, haz clic o presiona una tecla para continuar.',
  },
  en: {
    logoAlt: 'Logo',
    title: (
      <>
        Explore success
        <br />
        stories with AI
        <br />
        in Mexico
      </>
    ),
    openCaseAria: (n: string) => `Open case: ${n}`,
    overlayAria: (n: string) => `Case: ${n}`,
    close: 'Close',
    menu: 'Menu',
    restart: 'Restart',
    idleTitle: 'Inactivity detected',
    idleMsg1: (s: number) => (
      <>
        You will be redirected to the home in <strong>{s}</strong> seconds…
      </>
    ),
    idleMsg2: 'Tap, click, or press a key to continue.',
  },
} as const;

export default function CasosPage({
  onMenu,
  onRestart,
  casos = CASOS_DEF,
  lang = 'es', // ← NUEVO
}: Props) {
  const t = LABELS[lang];
  const [open, setOpen] = useState<null | Caso>(null);

  // ==================== INACTIVIDAD (fase 1: 10s, fase 2: overlay 10s) ====================
  type IdlePhase = 'idle' | 'redirect' | 'off';
  const [idlePhase, setIdlePhase] = useState<IdlePhase>('off');
  const [redirectLeft, setRedirectLeft] = useState(10);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllIdle = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    if (redirectIntervalRef.current) {
      clearInterval(redirectIntervalRef.current);
    }
    idleTimerRef.current = null;
    redirectTimerRef.current = null;
    redirectIntervalRef.current = null;
    setIdlePhase('off');
  };

  const startIdlePhase1 = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    setIdlePhase('idle');
    idleTimerRef.current = setTimeout(() => {
      // fase 2: overlay con cuenta 10..0
      setIdlePhase('redirect');
      setRedirectLeft(10);
      redirectIntervalRef.current = setInterval(() => {
        setRedirectLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
      redirectTimerRef.current = setTimeout(() => {
        if (onRestart) {
          onRestart();
        } else {
          window.location.href = '/';
        }
      }, 10_000);
    }, 120_000);
  };

  const onAnyActivity = () => {
    clearAllIdle();
    startIdlePhase1();
  };

  useEffect(() => {
    const onClick = () => onAnyActivity();
    const onKey = () => onAnyActivity();
    const onTouch = () => onAnyActivity();
    window.addEventListener('click', onClick, { passive: true } as any);
    window.addEventListener('keydown', onKey as any);
    window.addEventListener('touchstart', onTouch, { passive: true } as any);
    startIdlePhase1();
    return () => {
      window.removeEventListener('click', onClick as any);
      window.removeEventListener('keydown', onKey as any);
      window.removeEventListener('touchstart', onTouch as any);
      clearAllIdle();
    };
  }, []);

  // ==================== UI ====================
  const FS = {
    title: 'clamp(28px, 7.2vmin, 75px)',
    item: 'clamp(16px, 5vmin, 50px)',
    overlayTitle: 'clamp(18px, 3.6vmin, 44px)',
    closeBtn: 'clamp(14px, 2.8vmin, 32px)',
    topBtn: 'clamp(14px, 2.8vmin, 30px)',
    countdown: 'clamp(14px, 3.2vmin, 28px)',
  } as const;

  const arrowIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="1.5em"
      height="1.5em"
      style={{ fontSize: 'clamp(22px, 4.2vmin, 56px)' }}
      aria-hidden
    >
      <path
        d="M4 12h13M12 5l7 7-7 7"
        fill="none"
        stroke="#7f149a"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <Box
      component="section"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        background: "url('/fondo_casos.png') center / cover no-repeat",
        color: '#2F3537',
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* Header: logo + botones superiores */}
      <Box pt={40} pl={80} pr={20}>
        <img
          src="/logo_bo25b.png"
          alt={t.logoAlt}
          style={{
            height: 'clamp(48px, 20vw, 200px)',
            width: 'auto',
            objectFit: 'contain',
            marginBlock: '20px',
          }}
        />

        <Box mt={45} mb={8}>
          <Text fw={500} style={{ fontSize: FS.title, lineHeight: 1.2, margin: 0 }}>
            {t.title}
          </Text>
        </Box>
      </Box>

      {/* Lista */}
      <Box
        style={{
          position: 'absolute',
          top: 'clamp(260px, 55vmin, 820px)',
          left: 'clamp(16px, 15vmin, 160px)',
          right: 'clamp(16px, 5vmin, 120px)',
          display: 'grid',
          rowGap: 'clamp(8px, 1.6vmin, 16px)',
        }}
      >
        {casos.map((c) => (
          <button
            key={c.nombre}
            type="button"
            onClick={() => setOpen(c)}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '8px 4px',
            }}
            aria-label={t.openCaseAria(c.nombre)}
          >
            {arrowIcon()}
            <Text style={{ fontSize: FS.item, fontWeight: 700 }}>{c.nombre}</Text>
          </button>
        ))}
      </Box>

      {/* Overlay interno con IFRAME */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.overlayAria(open.nombre)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: 'clamp(10px, 3vmin, 28px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(null);
            }
          }}
        >
          <div
            style={{
              width: 'min(96vw, 1200px)',
              height: 'min(86vh, 900px)',
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Group
              justify="space-between"
              align="center"
              p="md"
              style={{ borderBottom: '1px solid #E5E7EB' }}
            >
              <Text style={{ fontSize: FS.overlayTitle, fontWeight: 800 }}>{open.nombre}</Text>
              <button
                type="button"
                onClick={() => setOpen(null)}
                style={{
                  fontSize: FS.closeBtn,
                  fontWeight: 800,
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: 10,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                {t.close}
              </button>
            </Group>
            <iframe
              src={open.url}
              title={open.nombre}
              style={{ flex: 1, border: 'none', width: '100%' }}
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>
        </div>
      )}

      {/* Botones: Menú y Reiniciar */}
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 24px',
          gap: 'clamp(12px, 3vmin, 28px)',
          zIndex: 900,
        }}
      >
        <button
          type="button"
          onClick={() => onMenu?.()}
          style={{
            color: '#2F3537',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            padding: 'clamp(10px, 2vmin, 20px) clamp(18px, 4vmin, 36px)',
            fontWeight: 800,
            fontSize: 'clamp(14px, 2.8vmin, 30px)',
            cursor: 'pointer',
            boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
          }}
        >
          {t.menu}
        </button>

        <button
          type="button"
          onClick={() => onRestart?.()}
          style={{
            color: '#121212',
            border: 'none',
            borderRadius: 12,
            padding: 'clamp(10px, 2vmin, 20px) clamp(18px, 4vmin, 36px)',
            fontWeight: 900,
            fontSize: 'clamp(14px, 2.8vmin, 30px)',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          }}
        >
          {t.restart}
        </button>
      </Box>

      {/* Overlay de inactividad (solo fase de redirección) */}
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
            zIndex: 1500,
            padding: 24,
          }}
          onClick={onAnyActivity}
          onKeyDown={(e) => {
            if (e.key) {
              onAnyActivity();
            }
          }}
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
            <h3 style={{ margin: 0, fontSize: FS.overlayTitle, fontWeight: 800 }}>
              {t.idleTitle}
            </h3>
            <p style={{ margin: '10px 0 0', fontSize: FS.countdown }}>
              {t.idleMsg1(redirectLeft)}
            </p>
            <p style={{ margin: '10px 0 0', fontSize: FS.countdown, opacity: 0.9 }}>
              {t.idleMsg2}
            </p>
          </div>
        </div>
      )}
    </Box>
  );
}
