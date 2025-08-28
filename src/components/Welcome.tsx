import { Box, Text, Title } from '@mantine/core';

type WelcomeProps = { onStart?: () => void };

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <Box
      component="section"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        background: "url('/fondo.png') center / cover no-repeat",
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* Capa de contenido */}
      <Box
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          right: '18px',
          maxWidth: 800,
          textShadow: '0 1px 1px rgba(0,0,0,0.18)',
        }}
      >
        {/* Bienvenido - un poco más pequeño */}
        <Text
          style={{
            fontSize: 'clamp(40px, 5vw, 60px)',
            opacity: 0.85,
            marginBottom: 8,
          }}
        >
          ¡Bienvenido!
        </Text>

        {/* Título principal */}
        <Title
          order={1}
          style={{
            fontWeight: 800,
            lineHeight: 1.15,
            fontSize: 'clamp(36px, 6vw, 88px)',
            margin: '10px 0 16px',
          }}
        >
          Vive la experiencia
          <br />
          completa
        </Title>

        {/* Línea dorada */}
        <Box
          style={{
            width: 'clamp(40px, 8vw, 80px)',
            height: 'clamp(4px, 1vw, 8px)',
            borderRadius: 3,
            backgroundColor: '#D9B14A',
            margin: '10px 0 24px',
            opacity: 0.95,
          }}
        />

        {/* ¿Estás listo? - un poco más chico que el título */}
        <Text
          style={{
            fontSize: 'clamp(28px, 4vw, 58px)',
            opacity: 0.9,
            marginBottom: 20,
          }}
        >
          ¿Estás listo?
        </Text>

        {/* Botón */}
        <button
          type="button"
          onClick={onStart}
          style={{
            backgroundColor: '#F1F1F1',
            color: '#2F3537',
            fontWeight: 700,
            boxShadow: '0 1px 0 rgba(0,0,0,0.15)',
            fontSize: 'clamp(20px, 3vw, 40px)',
            padding: 'clamp(10px, 2vw, 20px) clamp(24px, 4vw, 40px)',
            borderRadius: 24,
            cursor: 'pointer',
          }}
        >
          Comienza aquí
        </button>
      </Box>
    </Box>
  );
}
