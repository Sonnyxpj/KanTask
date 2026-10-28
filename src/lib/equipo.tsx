import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { useSesion } from '@/lib/sesion';
import { supabase } from '@/lib/supabase';
import { listarUsuarios } from '@/services/usuarios';
import type { Usuario } from '@/types/modelos';

type ContextoEquipo = {
  usuarios: Usuario[];
  actual: Usuario | null;
  cargando: boolean;
  error: string;
  buscarUsuario: (id: string) => Usuario | undefined;
  recargar: () => Promise<void>;
};

const Contexto = createContext<ContextoEquipo | null>(null);

export function useEquipo() {
  const valor = use(Contexto);
  if (!valor) throw new Error('useEquipo debe usarse dentro de <ProveedorEquipo />');
  return valor;
}

// Integrantes del equipo (public.usuarios) + quién está conectado ahora (Realtime Presence)
export function ProveedorEquipo({ children }: PropsWithChildren) {
  const { sesion } = useSesion();
  const idUsuario = sesion?.user.id;
  const [lista, setLista] = useState<Usuario[]>([]);
  const [enLinea, setEnLinea] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    if (!idUsuario) {
      setLista([]);
      setCargando(false);
      return;
    }
    try {
      setLista(await listarUsuarios());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el equipo');
    } finally {
      setCargando(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  // Cada app con sesión se anuncia en el canal; la clave de presencia es el id del usuario
  useEffect(() => {
    if (!supabase || !idUsuario) {
      setEnLinea(new Set());
      return;
    }
    const cliente = supabase;
    const canal = cliente.channel('equipo-en-vivo', { config: { presence: { key: idUsuario } } });
    let suscrito = false;

    const anunciar = () => canal.track({ desde: new Date().toISOString() });

    canal
      .on('presence', { event: 'sync' }, () => setEnLinea(new Set(Object.keys(canal.presenceState()))))
      .subscribe((estado) => {
        suscrito = estado === 'SUBSCRIBED';
        if (suscrito && AppState.currentState === 'active') anunciar();
      });

    // En segundo plano deja de aparecer en vivo
    const escucha = AppState.addEventListener('change', (estado) => {
      if (!suscrito) return;
      if (estado === 'active') anunciar();
      else canal.untrack();
    });

    return () => {
      escucha.remove();
      cliente.removeChannel(canal);
    };
  }, [idUsuario]);

  const usuarios = useMemo(() => lista.map((u) => ({ ...u, enVivo: enLinea.has(u.id) })), [lista, enLinea]);
  const actual = usuarios.find((u) => u.id === idUsuario) ?? null;
  const buscarUsuario = useCallback((id: string) => usuarios.find((u) => u.id === id), [usuarios]);

  return (
    <Contexto.Provider value={{ usuarios, actual, cargando, error, buscarUsuario, recargar }}>
      {children}
    </Contexto.Provider>
  );
}
