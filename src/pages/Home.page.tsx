/* eslint-disable no-console */
import { useState } from 'react';
import ChatPage from '@/components/ChatPage_with_references';
import EncuestaPage from '@/components/EncuestaPage';
import { DatosIntro } from '@/components/DatosIntro';
import { MenuOpciones } from '@/components/MenuOpciones';
import { Welcome } from '@/components/Welcome';

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', fontSize: 24 }}>
      {title}
    </div>
  );
}

type View = 'welcome' | 'datos' | 'menu' | 'encuesta' | 'agente' | 'casos' | 'uso';

export function HomePage() {
  const [view, setView] = useState<View>('welcome');
  const [userId, setUserId] = useState<string | null>(null);
  const [shortId, setShortId] = useState<string | null>(null);

  if (view === 'welcome') {
    return <Welcome onStart={() => setView('datos')} />;
  }

  if (view === 'datos') {
    return (
      <DatosIntro
        onSubmit={(data, uid, sId) => {
          console.log('Perfil guardado:', { uid, shortId: sId, ...data });
          setUserId(uid);
          setShortId(sId);
          setView('menu');
        }}
      />
    );
  }

  if (view === 'menu') {
    return <MenuOpciones onSelect={(k) => setView(k)} backgroundSrc="/fondo_2.png" />;
  }

  if (view === 'encuesta') {
    return <EncuestaPage onSubmit={(answers) => console.log('OK', answers)} />;
  }

  if (view === 'agente') {
    // El ChatPage cerrará sesión y volverá aquí vía onTimeout cuando haya inactividad
    return <ChatPage mode="agente" onTimeout={() => setView('welcome')} />;
  }

  if (view === 'casos') {
    return <Placeholder title="Página: Casos de referencia" />;
  }

  return null;
}
