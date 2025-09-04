/* src/components/SurveyAnonIntro.tsx */
import { Box, Text, Title } from "@mantine/core";

type Lang = "es" | "en";

type Props = {
  onNext?: () => void;
  lang?: Lang;
};

// Diccionario de etiquetas
const LABELS = {
  es: {
    title: (
      <>
        Encuesta de
        <br />
        madurez digital de
        <br />
        Grupo Bimbo
      </>
    ),
    anonBlock: (
      <>
        <span style={{ fontWeight: 700 }}>La encuesta</span>
        <br />
        <span style={{ fontWeight: 700 }}>es anónima, tus</span>
        <br />
        <span style={{ fontWeight: 400 }}>respuestas serán</span> <br />
        <span style={{ fontWeight: 400 }}>únicamente utilizadas</span>
        <br />
        <span style={{ fontWeight: 400 }}>para mejorar la</span> <br />
        <span style={{ fontWeight: 400 }}>experiencia.</span>
        <br />
      </>
    ),
  },
  en: {
    title: (
      <>
        Digital maturity
        <br />
        survey of
        <br />
        Grupo Bimbo
      </>
    ),
    anonBlock: (
      <>
        <span style={{ fontWeight: 700 }}>The survey</span>
        <br />
        <span style={{ fontWeight: 700 }}>is anonymous, your</span>
        <br />
        <span style={{ fontWeight: 400 }}>responses will be</span> <br />
        <span style={{ fontWeight: 400 }}>used only</span>
        <br />
        <span style={{ fontWeight: 400 }}>to improve the</span> <br />
        <span style={{ fontWeight: 400 }}>experience.</span>
        <br />
      </>
    ),
  },
};

export default function SurveyAnonIntro({ onNext, lang = "en" }: Props) {
  const t = LABELS[lang];

  return (
    <Box
      component="section"
      onClick={onNext}
      style={{
        position: "relative",
        minHeight: "100dvh",
        width: "100%",
        background: "url('/fondo_flor_esquina.png') center / cover no-repeat",
        padding:
          "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
        color: "#2F3537",
      }}
    >
      {/* Logo superior izquierda */}
      <img
        src="/logo_bo25b.png"
        alt="Bimbo + Oracle 25 años"
        style={{
          position: "absolute",
          top: "clamp(12px, 1.6vmin, 28px)",
          left: "clamp(12px, 1.6vmin, 28px)",
          height: "clamp(48px, 20vmin, 160px)",
          width: "auto",
          objectFit: "contain",
          marginTop: "8%",
          marginLeft: "5%",
        }}
      />

      {/* Contenedor de contenido */}
      <Box
        style={{
          position: "absolute",
          top: "clamp(80px, 14vmin, 240px)",
          left: "clamp(16px, 4.5vmin, 120px)",
          right: "clamp(16px, 6vmin, 160px)",
          marginTop: "15%",
        }}
      >
        {/* Título principal */}
        <Title
          order={1}
          style={{
            fontWeight: 400,
            lineHeight: 1.15,
            fontSize: "clamp(28px, 7vmin, 96px)",
            margin: "0 0 clamp(10px, 2vmin, 24px)",
          }}
        >
          {t.title}
        </Title>

        {/* Flecha (SVG) */}
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          style={{
            fontSize: "clamp(22px, 10vmin, 130px)",
            marginTop: "1em",
            flex: "0 0 auto",
          }}
          aria-hidden="true"
        >
          <path
            d="M4 12h13M12 5l7 7-7 7"
            fill="none"
            stroke="#6E3DD1"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Bloque de “anónima” */}
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            alignItems: "start",
            columnGap: "clamp(10px, 2.2vmin, 28px)",
            marginTop: "clamp(8px, 1.5vmin, 18px)",
          }}
        >
          <Text
            style={{
              fontSize: "clamp(18px, 8vmin, 60px)",
              lineHeight: 1.35,
            }}
          >
            {t.anonBlock}
          </Text>
        </Box>
      </Box>

      {/* Borde inferior */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "clamp(8px, 1vmin, 14px)",
          background:
            "linear-gradient(to right, rgba(0,0,0,0.06), rgba(0,0,0,0.06))",
          opacity: 0.5,
        }}
      />
    </Box>
  );
}
