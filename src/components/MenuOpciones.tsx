import { Box, Text, Title } from '@mantine/core';

type MenuKey = 'encuesta' | 'agente' | 'casos' | 'uso';
type MenuOpcionesProps = {
  onSelect: (key: MenuKey) => void;
  backgroundSrc?: string;
};

export function MenuOpciones({ onSelect, backgroundSrc = '/fondo_2.png' }: MenuOpcionesProps) {
  const bg = `url('${backgroundSrc}') center / cover no-repeat`;

  // ---- Botón con forma orgánica (SVG) ----
  function StoneButton({
    label,
    onClick,
    rotate = 0,
    path,
    width = 650,
    height = 650,
    fontSize = 'clamp(20px, 5vw, 48px)', // 👈 igualamos a los tamaños grandes de tu intro
  }: {
    label: string;
    onClick: () => void;
    rotate?: number;
    path: string; // atributo "d" del <path>
    width?: number;
    height?: number;
    fontSize?: string | number;
  }) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        style={{
          all: 'unset',
          position: 'relative',
          width,
          height,
          transform: `rotate(${rotate}deg)`,
          cursor: 'pointer',
          filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.18))',
          userSelect: 'none',
          touchAction: 'manipulation',
        }}
      >
        <svg
          viewBox="0 0 170 110"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <defs>
            <filter id="soft" x="-0%" y="-20%" width="140%" height="140%" >
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.25" result="blur" />
              <feMerge >
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={path} fill="#FFFFFF" stroke="#E6EBEE" strokeWidth="1.5" filter="url(#soft)"  />
        </svg>

        {/* Texto centrado */}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            padding: '0 14px',
            color: '#2F3537',
            fontWeight: 700,
            fontSize,
            textAlign: 'center',
            transform: `rotate(${-rotate}deg)`,
            pointerEvents: 'none',
          }}
        >
          {label}
        </span>
      </button>
    );
  }

  // 4 formas irregulares (viewBox 0 0 170 110)
  const PATHS = {
    encuesta:
      'M18,60 C16,42 36,26 72,22 C110,18 146,30 152,54 C158,78 138,96 96,102 C58,108 28,88 18,60 Z',
    agente:
      'M22,58 C28,36 58,24 96,26 C126,28 150,42 154,60 C158,78 138,94 100,100 C62,106 34,90 22,72 Z',
    casos:
      'M20,66 C18,46 44,30 84,26 C118,22 148,34 150,58 C152,82 126,98 86,100 C52,102 28,90 20,66 Z',
  } as const;

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
      }}
    >
      {/* Textos superiores */}
      <Box
        style={{
          position: 'absolute',
          top: '8%',
          left: '5%',
          right: '5%',
          // color: '#fff',
          textShadow: '0 1px 1px rgba(0,0,0,0.18)',
        }}
      >
        <Text
          style={{
            opacity: 0.9,
            marginBottom: 12,
            fontSize: 'clamp(20px, 5vw, 60px)', // 👈 subtítulo grande como tu intro
          }}
        >
          Cuéntanos,
        </Text>
        <Title
          order={1}
          style={{
            fontWeight: 800,
            lineHeight: 1.15,
            fontSize: 'clamp(34px, 6vw, 110px)', // 👈 título grande como en DatosIntro
            margin: 0,
          }}
        >
          ¿Qué quieres
          <br />
          descubrir primero?
        </Title>
      </Box>

      {/* Grid de opciones */}
      <Box
        style={{
          position: 'absolute',
          top: '20%',
          left: '0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <StoneButton
          label="Encuesta"
          path={PATHS.encuesta}
          rotate={-10}
          onClick={() => onSelect('encuesta')}
        />
        <StoneButton
          label="Agente AI"
          path={PATHS.agente}
          rotate={7}
          onClick={() => onSelect('agente')}
        />
        <StoneButton
          label="Casos de referencia"
          path={PATHS.casos}
          rotate={-6}
          onClick={() => onSelect('casos')}
        />
      </Box>
    </Box>
  );
}
