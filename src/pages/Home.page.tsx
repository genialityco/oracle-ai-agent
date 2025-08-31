/* eslint-disable no-console */
// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import ChatPage from '@/components/ChatPage';
import EncuestaPage from '@/components/EncuestaPage';
import { MenuOpciones } from '@/components/MenuOpciones';
import SurveyAnonIntro from '@/components/SurveyAnonIntro';
import Welcome from '@/components/Welcome';
import CasosPage from '@/components/CasosPage';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

type View = 'welcome' | 'surveyIntro' | 'menu' | 'encuesta' | 'agente' | 'casos' | 'uso';

export function HomePage() {
  const [view, setView] = useState<View>('welcome');
  const [userId, setUserId] = useState<string | null>(null);
  const [shortId, setShortId] = useState<string | null>(null);

  // Auto-salto de intro encuesta -> menú
  useEffect(() => {
    if (view !== 'surveyIntro') {return;}
    const t = setTimeout(() => setView('encuesta'), 5000);
    return () => clearTimeout(t);
  }, [view]);

  const restartToWelcome = async () => {
    try { await signOut(auth); } catch (e) { /* noop */ }
    setUserId(null);
    setShortId(null);
    setView('welcome');
  };

  if (view === 'welcome') {
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
    return <SurveyAnonIntro onNext={() => setView('encuesta')} />;
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
    return <ChatPage mode="agente" onTimeout={restartToWelcome} />;
  }

  if (view === 'casos') {
    return (
      <CasosPage
        onMenu={() => setView('menu')}
        onRestart={restartToWelcome}
      />
    );
  }

  return null;
}
