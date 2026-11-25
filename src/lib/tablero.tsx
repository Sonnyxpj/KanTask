import { createContext, use, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { CHECKLIST, EVIDENCIAS, TAREAS } from '@/constants/datos-demo';
import { Claves, esErrorDeRed, guardar, leer } from '@/lib/almacen';
import { useEquipo } from '@/lib/equipo';
import { useSesion } from '@/lib/sesion';
import { supabase } from '@/lib/supabase';
import * as servicio from '@/services/tareas';
import type { BaseTablero, DatosTablero } from '@/services/tareas';
import { motivoNoCierre } from '@/lib/reglas';
import type { ChecklistItem, Estado, Evidencia, Tablero, Tarea, ValoresTarea } from '@/types/modelos';

type ContextoTablero = {
  tablero: Tablero | null;
  tareas: Tarea[];
  checklist: ChecklistItem[];
  evidencias: Evidencia[];
  cargando: boolean;
  error: string;
  // No hay conexión: se muestran los datos guardados en el teléfono (solo lectura)
  sinConexion: boolean;
  // Fecha de la última sincronización correcta (ISO)
  actualizado: string | null;
  // El tablero aún no existe y quien mira no es editor (no puede crearlo)
  sinTablero: boolean;
  recargar: () => Promise<void>;
  crearTarea: (valores: ValoresTarea) => Promise<string>;
  editarTarea: (id: string, valores: ValoresTarea) => Promise<void>;
  moverTarea: (id: string, estado: Estado) => Promise<void>;
  eliminarTarea: (id: string) => Promise<void>;
  alternarItem: (itemId: string) => Promise<void>;
  agregarEvidencia: (tareaId: string, uri: string, tipo?: string) => Promise<void>;
};

const Contexto = createContext<ContextoTablero | null>(null);

export function useTablero() {
  const valor = use(Contexto);
  if (!valor) throw new Error('useTablero debe usarse dentro de <ProveedorTablero />');
  return valor;
}

const DEMO = !supabase;
// Mientras no hay conexión se reintenta cada cierto tiempo
const REINTENTO_MS = 15_000;

type Cache = DatosTablero & { base: BaseTablero; actualizado: string };
const BASE_DEMO: BaseTablero = {
  tablero: { id: 'demo', nombre: 'Tablero de hoy', equipo: 'Equipo de desarrollo', usuario: '' },
  columnas: { pendiente: 'c1', en_progreso: 'c2', terminado: 'c3' },
};

// Tareas, checklist y evidencias del tablero. Con Supabase se sincroniza en vivo
// (postgres_changes); sin backend (modo demo) trabaja en memoria con datos de ejemplo.
export function ProveedorTablero({ children }: PropsWithChildren) {
  const { sesion } = useSesion();
  const { actual, cargando: cargandoEquipo } = useEquipo();
  const idUsuario = sesion?.user.id;
  const esEditor = actual?.rol === 'editor';

  const [base, setBase] = useState<BaseTablero | null>(DEMO ? BASE_DEMO : null);
  const [tareas, setTareas] = useState<Tarea[]>(DEMO ? TAREAS : []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEMO ? CHECKLIST : []);
  const [evidencias, setEvidencias] = useState<Evidencia[]>(DEMO ? EVIDENCIAS : []);
  const [cargando, setCargando] = useState(!DEMO);
  const [error, setError] = useState('');
  const [sinTablero, setSinTablero] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [actualizado, setActualizado] = useState<string | null>(null);

  // Al iniciar o cerrar sesión se parte de cero; si hay copia local (modo offline) se muestra
  // de inmediato mientras llega lo nuevo. Ajuste durante el render (null = primer render).
  const [idPrevio, setIdPrevio] = useState<string | undefined | null>(null);
  if (!DEMO && idPrevio !== idUsuario) {
    setIdPrevio(idUsuario);
    const cache = idUsuario ? leer<Cache>(Claves.tablero(idUsuario)) : null;
    setBase(cache?.base ?? null);
    setTareas(cache?.tareas ?? []);
    setChecklist(cache?.checklist ?? []);
    setEvidencias(cache?.evidencias ?? []);
    setActualizado(cache?.actualizado ?? null);
    setCargando(!cache);
    setError('');
    setSinTablero(false);
    setSinConexion(false);
  }

  // La base (tablero + columnas) se usa dentro de callbacks y del canal Realtime.
  // Se declara antes del efecto de carga para que esté al día cuando éste corra.
  const baseRef = useRef<BaseTablero | null>(DEMO ? BASE_DEMO : null);
  useEffect(() => {
    baseRef.current = base;
  }, [base]);

  const recargar = useCallback(async () => {
    // Esperar a conocer el rol: solo un editor puede crear el tablero si aún no existe
    if (DEMO || !idUsuario || cargandoEquipo) return;
    try {
      let actualBase = baseRef.current;
      if (!actualBase) {
        actualBase = await servicio.obtenerTablero(esEditor);
        if (!actualBase) {
          setSinTablero(true);
          return;
        }
        setSinTablero(false);
        setBase(actualBase);
        baseRef.current = actualBase;
      }
      const datos = await servicio.cargarDatosTablero(Object.values(actualBase.columnas));
      setTareas(datos.tareas);
      setChecklist(datos.checklist);
      setEvidencias(datos.evidencias);
      setError('');
      setSinConexion(false);
      // Copia local para el modo offline
      const ahora = new Date().toISOString();
      setActualizado(ahora);
      guardar(Claves.tablero(idUsuario), { base: actualBase, ...datos, actualizado: ahora } satisfies Cache);
    } catch (e) {
      if (esErrorDeRed(e)) {
        setSinConexion(true);
        // Con datos guardados basta el aviso de "sin conexión"
        setError(baseRef.current ? '' : 'Sin conexión y no hay datos guardados en este teléfono');
      } else {
        setError(e instanceof Error ? e.message : 'No se pudo cargar el tablero');
      }
    } finally {
      setCargando(false);
    }
  }, [idUsuario, esEditor, cargandoEquipo]);

  const recargarRef = useRef(recargar);
  useEffect(() => {
    recargarRef.current = recargar;
  }, [recargar]);

  // Carga inicial (y cada vez que cambia el rol)
  useEffect(() => {
    if (DEMO || !idUsuario) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona: el estado cambia después del await
    recargar();
  }, [idUsuario, recargar]);

  // Sin conexión: reintentar periódicamente
  useEffect(() => {
    if (!sinConexion) return;
    const intervalo = setInterval(() => recargarRef.current(), REINTENTO_MS);
    return () => clearInterval(intervalo);
  }, [sinConexion]);

  // Los cambios necesitan el servidor (las reglas de permisos y de cierre viven en la BD)
  const requerirConexion = () => {
    if (sinConexion)
      throw new Error('Sin conexión: este cambio no se puede guardar ahora. Intenta cuando vuelva internet');
  };

  // Sincronización en vivo entre dispositivos. Ante cualquier cambio se recarga el tablero
  // (agrupando ráfagas de eventos), y al volver del segundo plano por si se perdieron eventos.
  useEffect(() => {
    if (!supabase || !idUsuario) return;
    const cliente = supabase;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const programar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => recargarRef.current(), 250);
    };

    const canal = cliente
      .channel('tablero-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, programar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, programar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evidencias' }, programar)
      .subscribe();

    const escucha = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') programar();
    });

    return () => {
      clearTimeout(temporizador);
      escucha.remove();
      cliente.removeChannel(canal);
    };
  }, [idUsuario]);

  const necesitarBase = () => {
    const b = baseRef.current;
    if (!b) throw new Error('El tablero todavía no está listo');
    return b;
  };

  const crearTarea = async (valores: ValoresTarea) => {
    requerirConexion();
    const b = necesitarBase();
    if (DEMO) {
      const id = `t${Date.now()}`;
      setTareas((p) => [
        ...p,
        {
          id,
          columnaId: b.columnas.pendiente,
          asignadoA: valores.asignadoA,
          titulo: valores.titulo.trim(),
          descripcion: valores.descripcion.trim(),
          prioridad: valores.prioridad,
          fechaLimite: valores.fechaLimite,
          estado: 'pendiente',
        },
      ]);
      setChecklist((p) => [
        ...p,
        ...valores.checklist
          .filter((i) => i.descripcion.trim())
          .map((i, n) => ({ id: `${id}-k${n}`, tareaId: id, descripcion: i.descripcion.trim(), completado: false })),
      ]);
      return id;
    }
    const id = await servicio.crearTarea(b.columnas.pendiente, valores);
    await recargar();
    return id;
  };

  const editarTarea = async (id: string, valores: ValoresTarea) => {
    requerirConexion();
    const actuales = checklist.filter((i) => i.tareaId === id);
    if (DEMO) {
      setTareas((p) =>
        p.map((t) =>
          t.id === id
            ? {
                ...t,
                titulo: valores.titulo.trim(),
                descripcion: valores.descripcion.trim(),
                prioridad: valores.prioridad,
                fechaLimite: valores.fechaLimite,
                asignadoA: valores.asignadoA,
              }
            : t,
        ),
      );
      setChecklist((p) => [
        ...p.filter((i) => i.tareaId !== id),
        ...valores.checklist
          .filter((i) => i.descripcion.trim())
          .map((i, n) => ({
            id: i.id ?? `${id}-k${Date.now()}-${n}`,
            tareaId: id,
            descripcion: i.descripcion.trim(),
            completado: actuales.find((a) => a.id === i.id)?.completado ?? false,
          })),
      ]);
      return;
    }
    await servicio.editarTarea(id, valores, actuales);
    await recargar();
  };

  const moverTarea = async (id: string, estado: Estado) => {
    requerirConexion();
    const b = necesitarBase();
    if (estado === 'terminado') {
      // Se valida antes para dar un mensaje claro; la BD lo vuelve a validar
      const motivo = motivoNoCierre(
        checklist.filter((i) => i.tareaId === id),
        evidencias.filter((e) => e.tareaId === id),
      );
      if (motivo) throw new Error(motivo);
    }
    const anterior = tareas;
    setTareas((p) => p.map((t) => (t.id === id ? { ...t, estado, columnaId: b.columnas[estado] } : t)));
    if (DEMO) return;
    try {
      await servicio.moverTarea(id, estado, b.columnas[estado]);
    } catch (e) {
      setTareas(anterior);
      throw e;
    }
  };

  const eliminarTarea = async (id: string) => {
    requerirConexion();
    const rutas = evidencias.filter((e) => e.tareaId === id).map((e) => e.urlFoto);
    if (!DEMO)
      await servicio.eliminarTarea(
        id,
        rutas.filter((r) => !servicio.esUrlDirecta(r)),
      );
    setTareas((p) => p.filter((t) => t.id !== id));
    setChecklist((p) => p.filter((i) => i.tareaId !== id));
    setEvidencias((p) => p.filter((e) => e.tareaId !== id));
  };

  const alternarItem = async (itemId: string) => {
    requerirConexion();
    const item = checklist.find((i) => i.id === itemId);
    if (!item) return;
    const cambiar = (completado: boolean) =>
      setChecklist((p) => p.map((i) => (i.id === itemId ? { ...i, completado } : i)));
    cambiar(!item.completado);
    if (DEMO) return;
    try {
      await servicio.marcarItem(itemId, !item.completado);
    } catch (e) {
      cambiar(item.completado);
      throw e;
    }
  };

  const agregarEvidencia = async (tareaId: string, uri: string, tipo?: string) => {
    requerirConexion();
    if (DEMO) {
      setEvidencias((p) => [...p, { id: `e${Date.now()}`, tareaId, urlFoto: uri, fecha: new Date().toISOString() }]);
      return;
    }
    const nueva = await servicio.subirEvidencia(tareaId, uri, tipo);
    setEvidencias((p) => (p.some((e) => e.id === nueva.id) ? p : [...p, nueva]));
  };

  return (
    <Contexto.Provider
      value={{
        tablero: base?.tablero ?? null,
        tareas,
        checklist,
        evidencias,
        cargando,
        error,
        sinConexion,
        actualizado,
        sinTablero,
        recargar,
        crearTarea,
        editarTarea,
        moverTarea,
        eliminarTarea,
        alternarItem,
        agregarEvidencia,
      }}>
      {children}
    </Contexto.Provider>
  );
}
