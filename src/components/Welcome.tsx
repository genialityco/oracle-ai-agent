/* eslint-disable no-console */
/* src/components/IntroUnified.tsx */
import React, { useEffect, useState } from 'react';
import { Box, Text, Title } from '@mantine/core';
import { ensureAnonAuth, saveUserIntro } from '@/lib/firebaseClient';

type IntroUnifiedProps = {
  onDone?: (data: { nombre: string; email: string; rol: string }, uid: string, shortId: string) => void;
};

export default function Welcome({ onDone }: IntroUnifiedProps) {
  const [uid, setUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await ensureAnonAuth();
        setUid(user.uid);
      } catch (e) {
        console.error('Error al autenticar anónimamente:', e);
      }
    })();
  }, []);

  // En 1280x1920: 1vmin = 12.8px → 10vmin = 128px
  const inputBase: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: 'clamp(2px, 0.3vmin, 4px) solid rgba(255,255,255,0.55)',
    color: '#FFFFFF',
    fontSize: 'clamp(18px, 3.2vmin, 44px)', // ~41px en 1280x1920
    lineHeight: 1.25,
    outline: 'none',
    marginBottom: 'clamp(14px, 2vmin, 28px)',
  };

  const labelRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 1.2vmin, 18px)',
    color: '#FFFFFF',
    fontSize: 'clamp(16px, 2.6vmin, 36px)', // ~33px
    fontWeight: 700,
    marginTop: 'clamp(8px, 1.2vmin, 16px)',
    marginBottom: 'clamp(4px, 0.8vmin, 12px)',
  };

  const bulletDot: React.CSSProperties = {
    width: 'clamp(8px, 1.2vmin, 16px)',  // ~15px
    height: 'clamp(8px, 1.2vmin, 16px)',
    borderRadius: '50%',
    background: '#D9B14A',
    display: 'inline-block',
    flex: '0 0 auto',
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      nombre: (fd.get('nombre') || '').toString(),
      email: (fd.get('email') || '').toString(),
      rol: (fd.get('rol') || '').toString(),
    };

    try {
      setSaving(true);
      let effectiveUid = uid;
      if (!effectiveUid) {
        const user = await ensureAnonAuth();
        effectiveUid = user.uid;
        setUid(user.uid);
      }
      const { uid: finalUid, shortId } = await saveUserIntro(effectiveUid!, data);
      onDone?.(data, finalUid, shortId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      component="section"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        background: "url('/fondo_home.png') center / cover no-repeat",
        color: '#FFFFFF',
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* Logo superior (izquierda) */}
      <img
        src="/logo_bo25.png"
        alt="Logo"
        style={{
          position: 'absolute',
          top: 'clamp(12px, 1.6vmin, 28px)',
          left: 'clamp(12px, 1.6vmin, 28px)',
          height: 'clamp(48px, 20vmin, 160px)',
          width: 'auto',
          objectFit: 'contain',
        }}
      />

      {/* Logo inferior (flor) */}
      <img
        src="/logo_flor.png"
        alt="Flor"
        style={{
          position: 'absolute',
          bottom: 'clamp(12px, 1.6vmin, 28px)',
          left: 'clamp(12px, 1.6vmin, 28px)',
          height: 'clamp(60px, 11vmin, 200px)', // ~140px
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Contenido principal */}
      <Box
        style={{
          position: 'absolute',
          top: 'clamp(40px, 15vmin, 190px)',
          left: 'clamp(20px, 5vmin, 120px)',
          right: 'clamp(20px, 5vmin, 120px)',
          maxWidth: 'min(72ch, 800px)', // columna más cómoda
          textShadow: '0 1px 1px rgba(0,0,0,0.5)',
        }}
      >
        {/* Saludo */}
        <Text
          style={{
            fontSize: 'clamp(20px, 5vmin, 80px)', // ~58px → grande
            opacity: 0.95,
            marginBlock: 'clamp(6px, 5vmin, 70px)',
            fontWeight: 300,
          }}
        >
          ¡Bienvenido!
        </Text>

        {/* Título principal */}
        <Title
          order={1}
          style={{
            fontWeight: 600,
            lineHeight: 1.1,
            fontSize: 'clamp(32px, 6vmin, 70px)', // ~128px en 1280x1920
            margin: 'clamp(4px, 1vmin, 12px) 0',
          }}
        >
          Empecemos
          <br />
          con tus datos
        </Title>

        {/* Subtítulo */}
        <Text
          style={{
            marginTop: 'clamp(4px, 0.8vmin, 10px)',
            marginBottom: 'clamp(10px, 2vmin, 24px)',
            opacity: 0.9,
            fontSize: 'clamp(16px, 3.2vmin, 40px)', // ~41px
            fontWeight: 500,
          }}
        >
          Solo tomará un momento.
        </Text>

        <form onSubmit={handleSubmit} style={{marginLeft: '20%', marginTop: "20%"}}>
          {/* Nombre */}
          <label style={labelRow} htmlFor="nombre">
            <span style={bulletDot} />
            <span>Tu nombre y apellido</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            style={inputBase}
            aria-label="Nombre y apellido"
            autoComplete="name"
            required
          />

          {/* Email */}
          <label style={labelRow} htmlFor="email">
            <span style={bulletDot} />
            <span>Correo electrónico de contacto</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            style={inputBase}
            aria-label="Correo electrónico de contacto"
            autoComplete="email"
            required
          />

          {/* Rol */}
          <label style={labelRow} htmlFor="rol">
            <span style={bulletDot} />
            <span>Tu puesto o rol</span>
          </label>
          <input
            id="rol"
            name="rol"
            style={inputBase}
            aria-label="Puesto o rol"
            autoComplete="organization-title"
            required
          />

          {/* Botón Siguiente */}
          <button
            type="submit"
            disabled={saving || !uid}
            style={{
              marginTop: 'clamp(16px, 2.4vmin, 36px)',
              background: '#FFD84D',
              color: '#121212',
              fontWeight: 900,
              fontSize: 'clamp(18px, 3vmin, 44px)', // ~38px
              padding: 'clamp(10px, 2vmin, 22px) clamp(18px, 3.5vmin, 48px)',
              borderRadius: 'clamp(8px, 1.2vmin, 16px)',
              border: 'none',
              boxShadow: '0 0.4vmin 1.2vmin rgba(0,0,0,0.28)',
              cursor: saving || !uid ? 'not-allowed' : 'pointer',
              opacity: saving || !uid ? 0.75 : 1,
              display: 'inline-block',
            }}
          >
            {saving ? 'Guardando…' : 'Siguiente'}
          </button>
        </form>
      </Box>
    </Box>
  );
}
