/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import ChatPage from '@/components/ChatPage';
import EncuestaPage from '@/components/EncuestaPage';
import { MenuOpciones } from '@/components/MenuOpciones';
import SurveyAnonIntro from '@/components/SurveyAnonIntro';
import Welcome from '@/components/Welcome';

type View = 'welcome' | 'surveyIntro' | 'menu' | 'encuesta' | 'agente' | 'casos' | 'uso';

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', fontSize: 24 }}>
      {title}
    </div>
  );
}

export function HomePage() {
  const [view, setView] = useState<View>('welcome');
  const [userId, setUserId] = useState<string | null>(null);
  const [shortId, setShortId] = useState<string | null>(null);

  // Cuando entramos al intro de encuesta, saltamos al menú a los 5s
  useEffect(() => {
    if (view !== 'surveyIntro') {
      return;
    }
    const t = setTimeout(() => setView('menu'), 5000);
    return () => clearTimeout(t);
  }, [view]);

  if (view === 'welcome') {
    // IMPORTANTE: Welcome debe llamar onDone(data, uid, shortId) al enviar
    return (
      <Welcome
        onDone={(_, uid, sid) => {
          setUserId(uid);
          setShortId(sid);
          setView('surveyIntro');
        }}
      />
    );
  }

  if (view === 'surveyIntro') {
    // Pantalla “La encuesta es anónima…”
    return <SurveyAnonIntro onNext={() => setView('menu')} />;
  }

  if (view === 'menu') {
    return <MenuOpciones onSelect={(k) => setView(k)} />;
  }

  if (view === 'encuesta') {
    return (
      <EncuestaPage
        onSubmit={(answers) => {
          console.log('OK', answers, { userId, shortId });
          setView('menu');
        }}
      />
    );
  }

  if (view === 'agente') {
    return <ChatPage mode="agente" />;
  }

  if (view === 'casos') {
    return <Placeholder title="Página: Casos de referencia" />;
  }

  return null;
}
