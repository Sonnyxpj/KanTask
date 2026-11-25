import { createContext, use, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { ACTIVIDAD } from '@/constants/datos-demo';
import { Claves, guardar, leer } from '@/lib/almacen';
import { useEquipo } from '@/lib/equipo';
import { textoActividad } from '@/lib/reglas';
import { avisar } from '@/lib/notificaciones';
import { useSesion } from '@/lib/sesion';
import { supabase } from '@/lib/supabase';
import { aActividad, listarActividad } from '@/services/actividad';
import type { Actividad } from '@/types/modelos';

type ContextoActividad = {
  lista: Actividad[];
  cargando: boolean;
  error: string;
  sinConexion: boolean;
  // Avisos de otros integrantes que llegaron después de la última vez que se abrió la pestaña
  noLeidas: number;
  marcarVistas: () => void;
  recargar: () => Promise<void>;
};

const Contexto = createContext<ContextoActividad | null>(null);

export function useActividad() {
  const valor = use(Contexto);
  if (!valor) throw new Error('useActividad debe usarse dentro de <ProveedorActividad />');
  return valor;
}

const TITULOS: Record<Actividad['tipo'], string> = {
  asignacion: 'Nueva tarea asignada',
  cambio: 'Cambio de estado',
  evidencia: 'Nueva evidencia',
  completada: 'Tarea completada',
  mencion: 'Te mencionaron',
};

const DEMO = !supabase;

export function ProveedorActividad({ children }: PropsWithChildren) {
  const { sesion } = useSesion();
  const { buscarUsuario } = useEquipo();
  const idUsuario = sesion?.user.id;

  const [lista, setLista] = useState<Actividad[]>(DEMO ? ACTIVIDAD : []);
  const [cargando, setCargando] = useState(!DEMO);
  const [error, setError] = useState('');
  const [sinConexion, setSinConexion] = useState(false);
  const [vista, setVista] = useState<string>(() => new Date().toISOString());

  // Al iniciar o cerrar sesión se parte de cero (ajuste durante el render; null = primer render)
  const [idPrevio, setIdPrevio] = useState<string | undefined | null>(null);
  if (!DEMO && idPrevio !== idUsuario) {
    setIdPrevio(idUsuario);
    setLista(idUsuario ? (leer<Actividad[]>(Claves.actividad(idUsuario)) ?? []) : []);
    setCargando(true);
    setError('');
    setSinConexion(false);
    // Última vez que se abrió la pestaña (para el contador de no leídas)
    setVista((idUsuario && leer<string>(Claves.actividadVista(idUsuario))) || new Date().toISOString());
  }

  // buscarUsuario cambia con cada carga del equipo; el canal Realtime usa siempre el último
  const buscarRef = useRef(buscarUsuario);
  useEffect(() => {
    buscarRef.current = buscarUsuario;
  }, [buscarUsuario]);

  const recargar = useCallback(async () => {
    if (DEMO || !idUsuario) return;
    try {
      const nuevas = await listarActividad();
      setLista(nuevas);
      setError('');
      setSinConexion(false);
      guardar(Claves.actividad(idUsuario), nuevas);
    } catch (e) {
      const guardadas = leer<Actividad[]>(Claves.actividad(idUsuario));
      if (guardadas) {
        setLista((actual) => (actual.length ? actual : guardadas));
        setSinConexion(true);
      } else {
        setError(e instanceof Error ? e.message : 'No se pudo cargar la actividad');
      }
    } finally {
      setCargando(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    if (DEMO || !idUsuario) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona: el estado cambia después del await
    recargar();
  }, [idUsuario, recargar]);

  // Nuevas actividades en vivo (las insertan los triggers de la BD)
  useEffect(() => {
    if (!supabase || !idUsuario) return;
    const cliente = supabase;

    const canal = cliente
      .channel('actividad-en-vivo')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'actividad' }, (cambio) => {
        const nueva = aActividad(cambio.new as Parameters<typeof aActividad>[0]);
        setLista((p) => (p.some((a) => a.id === nueva.id) ? p : [nueva, ...p]));
        // Aviso local solo si me afecta y no lo hice yo
        if (nueva.destinatarioId === idUsuario && nueva.usuarioId !== idUsuario) {
          avisar(TITULOS[nueva.tipo], textoActividad(nueva, idUsuario, buscarRef.current), nueva.tareaId).catch(
            () => {},
          );
        }
      })
      // Al borrar una tarea su actividad se borra en cascada
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'actividad' }, (cambio) => {
        const id = (cambio.old as { id?: string }).id;
        if (id) setLista((p) => p.filter((a) => a.id !== id));
      })
      .subscribe();

    const escucha = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') recargar();
    });

    return () => {
      escucha.remove();
      cliente.removeChannel(canal);
    };
  }, [idUsuario, recargar]);

  const marcarVistas = useCallback(() => {
    const ahora = new Date().toISOString();
    setVista(ahora);
    if (idUsuario) guardar(Claves.actividadVista(idUsuario), ahora);
  }, [idUsuario]);

  const noLeidas = lista.filter((a) => a.fecha > vista && a.usuarioId !== idUsuario).length;

  return (
    <Contexto.Provider value={{ lista, cargando, error, sinConexion, noLeidas, marcarVistas, recargar }}>
      {children}
    </Contexto.Provider>
  );
}
