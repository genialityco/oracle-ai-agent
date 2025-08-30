import { Box, Text, Title } from '@mantine/core';

type MenuKey = 'encuesta' | 'agente' | 'casos' | 'uso';
type MenuOpcionesProps = {
  onSelect: (key: MenuKey) => void;
};

export function MenuOpciones({ onSelect }: MenuOpcionesProps) {
  // Flecha amarilla (igual que antes)
  const Arrow = () => (
    <svg
      viewBox="0 0 24 24"
      width="2.5em"
      height="2.5em"
      style={{ fontSize: 'clamp(22px, 4.2vmin, 56px)', flex: '0 0 auto' }}
      aria-hidden="true"
    >
      <path
        d="M4 12h13M12 5l7 7-7 7"
        fill="none"
        stroke="#FFD84D"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Ítem (agregamos offsetVmin)
  function MenuItem({
    lines,
    onClick,
    offsetVmin = 0, // ← nuevo
  }: {
    lines: string[];
    onClick: () => void;
    offsetVmin?: number;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        style={{
          all: 'unset',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'center',
          columnGap: 'clamp(10px, 2.2vmin, 28px)',
          cursor: 'pointer',
          color: '#FFFFFF',
          padding: 'clamp(4px, 0.8vmin, 12px) 0',
          marginInlineStart: `max(0px, ${offsetVmin}vmin)`,
          transition: 'transform 120ms ease, opacity 120ms ease',
        }}
      >
        <Arrow />
        <div style={{ display: 'grid', lineHeight: 1.2 }}>
          {lines.map((t, i) => (
            <span
              key={i}
              style={{
                fontWeight: 600,
                fontSize: 'clamp(16px, 8vmin, 48px)',
                textShadow: '0 1px 1px rgba(0,0,0,0.35)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </button>
    );
  }

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
      {/* Logo superior izquierda (igual a Welcome) */}
      <img
        src="/logo_bo25.png"
        alt="Bimbo + Oracle 25 años"
        style={{
          position: 'absolute',
          top: 'clamp(12px, 1.6vmin, 28px)',
          left: 'clamp(12px, 1.6vmin, 28px)',
          height: 'clamp(48px, 12vmin, 160px)',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
          margin: "4%"
        }}
      />

      {/* Flor inferior izquierda (igual a Welcome) */}
      <img
        src="/logo_flor.png"
        alt="Flor"
        style={{
          position: 'absolute',
          bottom: 'clamp(12px, 1.6vmin, 28px)',
          left: 'clamp(12px, 1.6vmin, 28px)',
          height: 'clamp(60px, 11vmin, 200px)',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Encabezado */}
      <Box
        style={{
          position: 'absolute',
          top: 'clamp(40px, 15vmin, 220px)',
          left: 'clamp(20px, 5vmin, 120px)',
          right: 'clamp(20px, 5vmin, 120px)',
          textShadow: '0 1px 1px rgba(0,0,0,0.5)',
        }}
      >
        <Text
          style={{
            opacity: 0.95,
            marginBlock: 'clamp(8px, 8vmin, 80px)',
            fontSize: 'clamp(20px, 8.4vmin, 80px)',
            fontWeight: 500,
          }}
        >
          Cuéntanos,
        </Text>
        <Title
          order={1}
          style={{
            fontWeight: 700,
            lineHeight: 1.1,
            fontSize: 'clamp(32px, 8.4vmin, 100px)',
            margin: 0,
          }}
        >
          ¿Qué quieres
          <br />
          descubrir primero?
        </Title>
      </Box>

      <Box
        style={{
          position: 'absolute',
          bottom: 'clamp(240px, 40vmin, 620px)',
          left: 'clamp(20px, 5vmin, 120px)',
          right: 'clamp(20px, 5vmin, 120px)',
          display: 'grid',
          rowGap: 'clamp(12px, 2.2vmin, 28px)',
        }}
      >
        <MenuItem
          lines={['Encuesta de madurez digital', 'de Grupo Bimbo']}
          offsetVmin={0}
          onClick={() => onSelect('encuesta')}
        />
        <MenuItem
          lines={['Platica con', 'un Agente AI']}
          offsetVmin={18}
          onClick={() => onSelect('agente')}
        />
        <MenuItem lines={['Casos', 'de éxito']} offsetVmin={35} onClick={() => onSelect('casos')} />
      </Box>
    </Box>
  );
}
