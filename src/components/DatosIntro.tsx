/* eslint-disable no-console */
/* eslint-disable no-alert */
// src/components/DatosIntro.tsx
import React, { useEffect, useState } from 'react';
import { Box, Text, Title } from '@mantine/core';
import { ensureAnonAuth, saveUserIntro } from '@/lib/firebaseClient';

type DatosIntroProps = {
  onSubmit?: (data: { nombre: string; email: string; rol: string }, uid: string, shortId: string) => void;
};

export function DatosIntro({ onSubmit }: DatosIntroProps) {
  const [uid, setUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // login anónimo al montar
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

  // Estilo base de los inputs (línea inferior)
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: 'clamp(10px, 2vw, 30px) 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid #B7C0C3',
    color: '#2F3537',
    fontSize: 'clamp(16px, 5vw, 50px)',
    outline: 'none',
    marginBottom: 18,
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
      // si por alguna razón no hay uid, volvemos a autenticar
      let effectiveUid = uid;
      if (!effectiveUid) {
        const user = await ensureAnonAuth();
        effectiveUid = user.uid;
        setUid(user.uid);
      }
      const { uid: finalUid, shortId } = await saveUserIntro(effectiveUid!, data);
      onSubmit?.(data, finalUid, shortId);
    } catch (err) {
      console.error('Error guardando datos:', err);
      alert('No se pudieron guardar tus datos. Intenta de nuevo.');
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
        background: "url('/fondo_2.png') center / contain no-repeat",
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* Títulos (en blanco sobre el fondo) */}
      <Box
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          textShadow: '0 1px 1px rgba(0,0,0,0.18)',
        }}
      >
        <Title
          order={1}
          style={{
            fontWeight: 800,
            lineHeight: 1.15,
            fontSize: 'clamp(34px, 6vw, 120px)',
            margin: 0,
          }}
        >
          Empecemos con tus datos
        </Title>

        <Text
          style={{
            marginTop: 14,
            opacity: 0.85,
            fontSize: 'clamp(20px, 5vw, 80px)',
          }}
        >
          Solo tomará un momento.
        </Text>
      </Box>

      {/* Tarjeta blanca orgánica con inputs */}
      <Box
        style={{
          position: 'absolute',
          top: '40%',
          left: '15%',
          width: 'min(90%, 820px)',
          background: '#FFFFFF',
          borderRadius: '30px 36px 26px 32px / 24px 28px 20px 26px',
          transform: 'rotate(-5deg)',
          padding: 'clamp(18px, 2.5vw, 28px)',
          border: '1px solid #E9ECEF',
          boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
        }}
      >
        <Box style={{ transform: 'rotate(5deg)', padding: '0 20px' }}>
          <form onSubmit={handleSubmit}>
            <input
              name="nombre"
              placeholder="Tu nombre y apellido"
              style={inputBase}
              aria-label="Nombre y apellido"
              autoComplete="name"
              required
            />
            <input
              name="email"
              placeholder="Correo electrónico de contacto"
              type="email"
              style={{ ...inputBase, marginTop: 18 }}
              aria-label="Correo electrónico de contacto"
              autoComplete="email"
              required
            />
            <input
              name="rol"
              placeholder="Tu puesto o rol"
              style={{ ...inputBase, marginTop: 18 }}
              aria-label="Puesto o rol"
              autoComplete="organization-title"
              required
            />

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={saving || !uid}
              style={{
                marginTop: 22,
                background: '#2F3537',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 'clamp(18px, 5vw, 45px)',
                padding: 'clamp(12px, 2vw, 22px) clamp(20px, 3vw, 40px)',
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                cursor: saving || !uid ? 'not-allowed' : 'pointer',
                opacity: saving || !uid ? 0.7 : 1,
              }}
              title={!uid ? 'Inicializando sesión anónima…' : 'Continuar'}
            >
              {saving ? 'Guardando…' : 'Continuar'}
            </button>
          </form>
        </Box>
      </Box>
    </Box>
  );
}
