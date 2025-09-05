/* eslint-disable no-console */
/* src/components/AdminPage.tsx */
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { db } from '@/lib/firebaseClient';
import { SURVEY } from '@/surveySchema';

type Profile = {
  uid: string;
  shortId: string;
  nombre: string;
  email: string;
  rol: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type SurveyResponse = {
  id: string;
  uid: string;
  answers: Record<string, string>;
  progress: number;
  step: number;
  totalSections: number;
  completed: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type UserRow = {
  profile?: Profile;
  responses: SurveyResponse[];
  latestAt?: Date | null;
};

function toDateSafe(v: any): Date | null {
  // Firestore Timestamp -> Date
  if (v?.toDate) {
    return v.toDate();
  }
  if (v instanceof Date) {
    return v;
  }
  return null;
}

function downloadCSV(filename: string, rows: Array<Record<string, any>>) {
  if (!rows.length) {
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const cell = r[h] ?? '';
          const str = typeof cell === 'string' ? cell : JSON.stringify(cell ?? '');
          // Escapar comas / dobles-comillas / saltos
          const escaped = `"${str.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
          return escaped;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  // Perfiles
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Respuestas (paginadas)
  const PAGE_SIZE = 50;
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Modal detalle
  const [open, setOpen] = useState(false);
  const [activeUid, setActiveUid] = useState<string | null>(null);

  // Eliminar usuario y respuesta de encuestas
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Mapa id de pregunta → texto
  const questionTextById = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of SURVEY) {
      map.set(q.id, q.text);
    }
    return map;
  }, []);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const snap = await getDocs(collection(db, 'profilesoracle'));
      const next: Record<string, Profile> = {};
      snap.forEach((doc) => {
        const d = doc.data();
        next[d.uid] = {
          uid: d.uid,
          shortId: d.shortId,
          nombre: d.nombre || '',
          email: d.email || '',
          rol: d.rol || '',
          createdAt: toDateSafe(d.createdAt),
          updatedAt: toDateSafe(d.updatedAt),
        };
      });
      setProfiles(next);
    } catch (e) {
      console.error('loadProfiles error', e);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadResponses = async (append = true) => {
    if (!hasMore && append) {
      return;
    }
    setLoadingResponses(true);
    try {
      const base = query(
        collection(db, 'surveyResponsesOracle'),
        orderBy('createdAt', 'desc'),
        ...(append && lastDoc ? [startAfter(lastDoc)] : []),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(base);
      const arr: SurveyResponse[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        arr.push({
          id: doc.id,
          uid: d.uid,
          answers: d.answers || {},
          progress: d.progress ?? 0,
          step: d.step ?? 0,
          totalSections: d.totalSections ?? 0,
          completed: !!d.completed,
          createdAt: toDateSafe(d.createdAt),
          updatedAt: toDateSafe(d.updatedAt),
        });
      });

      setResponses((old) => (append ? [...old, ...arr] : arr));
      const last = snap.docs[snap.docs.length - 1] ?? null;
      setLastDoc(last);
      setHasMore(arr.length === PAGE_SIZE);
    } catch (e) {
      console.error('loadResponses error', e);
    } finally {
      setLoadingResponses(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
    void loadResponses(false);
  }, []);

  // Agrupar por uid
  const grouped: Record<string, UserRow> = useMemo(() => {
    const rows: Record<string, UserRow> = {};
    // arranca con perfiles
    Object.values(profiles).forEach((p) => {
      rows[p.uid] = { profile: p, responses: [], latestAt: null };
    });
    // agrega/crea por respuestas
    for (const r of responses) {
      if (!rows[r.uid]) {
        rows[r.uid] = { responses: [], latestAt: null };
      }
      rows[r.uid].responses.push(r);
      const created = r.createdAt ?? null;
      if (!rows[r.uid].latestAt || (created && created > (rows[r.uid].latestAt as Date))) {
        rows[r.uid].latestAt = created;
      }
    }
    // si un perfil existe sin respuestas, latestAt puede venir de updatedAt del perfil
    for (const uid of Object.keys(rows)) {
      if (!rows[uid].latestAt) {
        rows[uid].latestAt = rows[uid].profile?.updatedAt ?? null;
      }
      // ordenar respuestas por fecha desc
      rows[uid].responses.sort((a, b) => {
        const ta = a.createdAt?.getTime?.() ?? 0;
        const tb = b.createdAt?.getTime?.() ?? 0;
        return tb - ta;
      });
    }
    return rows;
  }, [profiles, responses]);

  const list = useMemo(() => {
    // ordenar por último envío
    return Object.entries(grouped).sort(([, A], [, B]) => {
      const ta = A.latestAt?.getTime?.() ?? 0;
      const tb = B.latestAt?.getTime?.() ?? 0;
      return tb - ta;
    });
  }, [grouped]);

  const rows = list.map(([uid, row]) => {
    const p = row.profile;
    const count = row.responses.length;
    const last = row.latestAt ? row.latestAt.toLocaleString() : '—';
    return (
      <Table.Tr key={uid}>
        <Table.Td>
          <Group gap="xs">
            <Badge variant="light">{p?.shortId ?? uid.slice(0, 8)}</Badge>
            <Text fw={700}>{p?.nombre || '—'}</Text>
          </Group>
          <Text size="sm" c="dimmed">
            {uid}
          </Text>
        </Table.Td>
        <Table.Td>
          <div>{p?.email || '—'}</div>
          <Text size="sm" c="dimmed">
            {p?.rol || '—'}
          </Text>
        </Table.Td>
        <Table.Td>
          <Badge color={count > 0 ? 'green' : 'gray'}>{count}</Badge>
        </Table.Td>
        <Table.Td>{last}</Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                setActiveUid(uid);
                setOpen(true);
              }}
            >
              Ver detalle
            </Button>

            <Button
              size="xs"
              color="red"
              variant="outline"
              onClick={() => {
                setDeletingUid(uid);
                setConfirmOpen(true);
              }}
            >
              Borrar
            </Button>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  const exportCSVAll = () => {
    // 1 fila por respuesta (no por usuario)
    const rows: Record<string, any>[] = [];
    for (const r of responses) {
      const p = profiles[r.uid];
      const base = {
        uid: r.uid,
        shortId: p?.shortId ?? r.uid.slice(0, 8),
        nombre: p?.nombre ?? '',
        email: p?.email ?? '',
        rol: p?.rol ?? '',
        createdAt: r.createdAt ? r.createdAt.toISOString() : '',
        completed: r.completed,
        progress: r.progress,
      };
      // anexamos columnas por cada pregunta (texto legible)
      const entry: Record<string, any> = { ...base };
      for (const q of SURVEY) {
        const key = `[${q.id}] ${q.text}`;
        entry[key] = r.answers?.[q.id] ?? '';
      }
      rows.push(entry);
    }
    downloadCSV(`encuestas_${new Date().toISOString().slice(0, 19)}.csv`, rows);
  };

  async function deleteUserAndResponses(uid: string) {
    setDeleting(true);
    try {
      // 1) Borrar perfil (si existe)
      try {
        await deleteDoc(doc(db, 'profilesoracle', uid));
      } catch (e) {
        // si no existe, seguimos
        console.warn('Perfil no encontrado o no se pudo borrar:', e);
      }

      // 2) Borrar respuestas por lotes (paginado)
      const PAGE = 250; // seguro para batch (límite 500 operaciones/batch)
      // Loop de páginas
      // Nota: Firestore no permite "delete by query" directo; hacemos fetch+batch.
      // Para colecciones enormes, mover a Cloud Function.
      // Aquí es suficiente para admin UI.
      while (true) {
        const q = query(
          collection(db, 'surveyResponsesOracle'),
          where('uid', '==', uid),
          limit(PAGE)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          break;
        }

        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();

        // Si trajo menos que PAGE, se acabó
        if (snap.size < PAGE) {
          break;
        }
        // Si fue exactamente PAGE, repetimos para la siguiente página
      }

      // 3) Limpiar estado local
      setProfiles((prev) => {
        const next = { ...prev };
        delete next[uid];
        return next;
      });
      setResponses((prev) => prev.filter((r) => r.uid !== uid));
    } finally {
      setDeleting(false);
    }
  }

  const active = activeUid ? grouped[activeUid] : undefined;

  return (
    <Box p="lg" style={{ minHeight: '100dvh', background: '#0f172a', color: 'white' }}>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2} c="white">
            Panel de Administración
          </Title>
          <Text c="dimmed">Perfiles y respuestas de encuesta</Text>
        </div>
        <Group>
          <Tooltip label="Exporta una fila por cada respuesta enviada">
            <Button variant="outline" onClick={exportCSVAll}>
              Exportar CSV
            </Button>
          </Tooltip>
          <Button
            variant="filled"
            onClick={() => {
              setResponses([]);
              setLastDoc(null);
              setHasMore(true);
              void loadResponses(false);
            }}
          >
            Refrescar
          </Button>
        </Group>
      </Group>

      <Box bg="rgba(255,255,255,0.06)" p="md" style={{ borderRadius: 12 }}>
        <Group mb="sm" gap="md">
          <Badge variant="light" color="yellow">
            Perfiles: {Object.keys(profiles).length}
          </Badge>
          <Badge variant="light" color="blue">
            Respuestas cargadas: {responses.length}
          </Badge>
          {loadingProfiles && (
            <Group gap={6}>
              <Loader size="xs" /> <Text size="sm">Cargando perfiles…</Text>
            </Group>
          )}
          {loadingResponses && (
            <Group gap={6}>
              <Loader size="xs" /> <Text size="sm">Cargando respuestas…</Text>
            </Group>
          )}
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Usuario</Table.Th>
              <Table.Th>Contacto</Table.Th>
              <Table.Th>Respuestas</Table.Th>
              <Table.Th>Último envío</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>

        <Group mt="md" justify="center">
          {hasMore ? (
            <Button
              onClick={() => loadResponses(true)}
              variant="default"
              disabled={loadingResponses}
            >
              {loadingResponses ? 'Cargando…' : 'Cargar más'}
            </Button>
          ) : (
            <Text size="sm" c="dimmed">
              No hay más resultados
            </Text>
          )}
        </Group>
      </Box>

      {/* Modal detalle por usuario */}
      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Detalle de respuestas"
        centered
      >
        {!active ? (
          <Text size="sm" c="dimmed">
            Selecciona un usuario
          </Text>
        ) : (
          <Box>
            <Text fw={700} mb="xs">
              {active.profile?.nombre ?? activeUid}{' '}
              <Text span c="dimmed">
                ({active.profile?.email ?? 'sin email'})
              </Text>
            </Text>
            <Text size="sm" c="dimmed" mb="sm">
              UID: {activeUid} · Respuestas: {active.responses.length}
            </Text>

            {active.responses.length === 0 ? (
              <Text size="sm">Sin respuestas.</Text>
            ) : (
              <Box style={{ display: 'grid', gap: 12 }}>
                {active.responses.map((r) => (
                  <Box
                    key={r.id}
                    p="md"
                    style={{ background: '#f8fafc', borderRadius: 10, color: '#0f172a' }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text fw={700}>Respuesta {r.id.slice(0, 6)}</Text>
                      <Text size="sm" c="dimmed">
                        {r.createdAt ? r.createdAt.toLocaleString() : '—'}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" mb="sm">
                      Completado: {r.completed ? 'Sí' : 'No'} · Progreso: {r.progress}%
                    </Text>

                    <div style={{ display: 'grid', gap: 6 }}>
                      {Object.entries(r.answers).map(([qid, val]) => (
                        <div
                          key={qid}
                          style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}
                        >
                          <Text fw={600} size="sm">
                            {questionTextById.get(qid) ?? qid}
                          </Text>
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                            {String(val)}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Modal>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar borrado"
        centered
      >
        <Text mb="sm">
          ¿Seguro que deseas borrar al usuario{' '}
          <Text span fw={700}>
            {deletingUid ?? ''}
          </Text>{' '}
          y <b>todas sus respuestas</b>? Esta acción no se puede deshacer.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            color="red"
            loading={deleting}
            onClick={async () => {
              if (!deletingUid) {return;}
              await deleteUserAndResponses(deletingUid);
              setConfirmOpen(false);
              setDeletingUid(null);
              // Si estabas viendo su detalle, ciérralo
              if (activeUid === deletingUid) {
                setOpen(false);
                setActiveUid(null);
              }
            }}
          >
            {deleting ? 'Borrando…' : 'Borrar definitivamente'}
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
