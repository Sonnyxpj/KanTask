// Tablero, tareas, checklist y evidencias en Supabase.
// Las reglas de permisos (RLS por rol) y la regla de cierre (trigger validar_cierre_tarea)
// viven en supabase/schema.sql; aquí solo se traducen los errores para la interfaz.
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import type { ChecklistItem, Estado, Evidencia, Prioridad, Tablero, Tarea, ValoresTarea } from '@/types/modelos';

export type BaseTablero = {
  tablero: Tablero;
  // id de la columna que corresponde a cada estado
  columnas: Record<Estado, string>;
};

export type DatosTablero = {
  tareas: Tarea[];
  checklist: ChecklistItem[];
  evidencias: Evidencia[];
};

const BUCKET = 'evidencias';
// Las columnas por defecto (trigger crear_columnas_por_defecto) se crean con orden 0, 1 y 2
const ESTADO_POR_ORDEN: Estado[] = ['pendiente', 'en_progreso', 'terminado'];

type FilaTarea = {
  id: string;
  columna_id: string;
  asignado_a: string | null;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  fecha_limite: string;
  estado: Estado;
};
type FilaChecklist = { id: string; tarea_id: string; descripcion: string; completado: boolean };
type FilaEvidencia = { id: string; tarea_id: string; url_foto: string; fecha: string };

const COLUMNAS_TAREA = 'id, columna_id, asignado_a, titulo, descripcion, prioridad, fecha_limite, estado';

const aTarea = (f: FilaTarea): Tarea => ({
  id: f.id,
  columnaId: f.columna_id,
  asignadoA: f.asignado_a ?? '',
  titulo: f.titulo,
  descripcion: f.descripcion,
  prioridad: f.prioridad,
  fechaLimite: f.fecha_limite,
  estado: f.estado,
});
const aItem = (f: FilaChecklist): ChecklistItem => ({
  id: f.id,
  tareaId: f.tarea_id,
  descripcion: f.descripcion,
  completado: f.completado,
});
const aEvidencia = (f: FilaEvidencia): Evidencia => ({
  id: f.id,
  tareaId: f.tarea_id,
  urlFoto: f.url_foto,
  fecha: f.fecha,
});

function cliente(): SupabaseClient {
  if (!supabase) throw new Error('No hay conexión con el servidor');
  return supabase;
}

// Errores de RLS y de los triggers → mensajes para el usuario
function traducir(error: PostgrestError | { message: string }, porDefecto: string): Error {
  const mensaje = error.message;
  // Los triggers ya lanzan el mensaje en español (validar_cierre_tarea)
  if (
    mensaje.includes('checklist sin completar') ||
    mensaje.includes('foto de evidencia') ||
    mensaje.includes('asignar tareas a editores') ||
    mensaje.includes('Solo los editores pueden editar')
  )
    return new Error(mensaje);
  if (mensaje.includes('row-level security') || ('code' in error && error.code === '42501'))
    return new Error('No tienes permiso para hacer esto');
  if (mensaje.toLowerCase().includes('maximum allowed size') || mensaje.toLowerCase().includes('too large'))
    return new Error('La foto supera el máximo de 5 MB');
  if (mensaje.toLowerCase().includes('network') || mensaje.toLowerCase().includes('fetch'))
    return new Error('Sin conexión. Revisa tu internet e intenta de nuevo');
  return new Error(porDefecto);
}

// ---------------------------------------------------------------------------
// Tablero
// ---------------------------------------------------------------------------

// Devuelve el tablero del equipo (el primero creado). Si no existe y quien lo pide es
// editor, lo crea; el trigger al_crear_tablero agrega las 3 columnas.
export async function obtenerTablero(crearSiFalta: boolean): Promise<BaseTablero | null> {
  const sb = cliente();

  const consulta = await sb
    .from('tableros')
    .select('id, nombre, equipo, usuario_id')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (consulta.error) throw traducir(consulta.error, 'No se pudo cargar el tablero');

  let fila = consulta.data;
  if (!fila) {
    if (!crearSiFalta) return null;
    const nuevo = await sb
      .from('tableros')
      .insert({ nombre: 'Tablero de hoy', equipo: 'Equipo de desarrollo' })
      .select('id, nombre, equipo, usuario_id')
      .single();
    if (nuevo.error) throw traducir(nuevo.error, 'No se pudo crear el tablero');
    fila = nuevo.data;
  }

  const cols = await sb.from('columnas').select('id, orden').eq('tablero_id', fila.id).order('orden');
  if (cols.error) throw traducir(cols.error, 'No se pudieron cargar las columnas');

  const columnas: Partial<Record<Estado, string>> = {};
  for (const c of cols.data as { id: string; orden: number }[]) {
    const estado = ESTADO_POR_ORDEN[c.orden];
    if (estado) columnas[estado] = c.id;
  }
  if (!columnas.pendiente || !columnas.en_progreso || !columnas.terminado)
    throw new Error('El tablero no tiene las columnas Pendiente, En progreso y Terminado');

  return {
    tablero: { id: fila.id, nombre: fila.nombre, equipo: fila.equipo ?? '', usuario: fila.usuario_id },
    columnas: columnas as Record<Estado, string>,
  };
}

// Tareas del tablero con su checklist y sus evidencias
export async function cargarDatosTablero(columnaIds: string[]): Promise<DatosTablero> {
  const sb = cliente();

  const tareas = await sb
    .from('tareas')
    .select(COLUMNAS_TAREA)
    .in('columna_id', columnaIds)
    .order('posicion')
    .order('created_at');
  if (tareas.error) throw traducir(tareas.error, 'No se pudieron cargar las tareas');

  const ids = (tareas.data as FilaTarea[]).map((t) => t.id);
  if (ids.length === 0) return { tareas: [], checklist: [], evidencias: [] };

  const [checklist, evidencias] = await Promise.all([
    sb.from('checklist_items').select('id, tarea_id, descripcion, completado').in('tarea_id', ids).order('orden'),
    sb.from('evidencias').select('id, tarea_id, url_foto, fecha').in('tarea_id', ids).order('fecha'),
  ]);
  if (checklist.error) throw traducir(checklist.error, 'No se pudo cargar el checklist');
  if (evidencias.error) throw traducir(evidencias.error, 'No se pudieron cargar las evidencias');

  return {
    tareas: (tareas.data as FilaTarea[]).map(aTarea),
    checklist: (checklist.data as FilaChecklist[]).map(aItem),
    evidencias: (evidencias.data as FilaEvidencia[]).map(aEvidencia),
  };
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

const filaDesdeValores = (v: ValoresTarea) => ({
  titulo: v.titulo.trim(),
  descripcion: v.descripcion.trim(),
  prioridad: v.prioridad,
  fecha_limite: v.fechaLimite,
  asignado_a: v.asignadoA || null,
});

const itemsLimpios = (v: ValoresTarea) =>
  v.checklist.map((i) => ({ ...i, descripcion: i.descripcion.trim() })).filter((i) => i.descripcion);

export async function crearTarea(columnaPendiente: string, valores: ValoresTarea): Promise<string> {
  const sb = cliente();

  const nueva = await sb
    .from('tareas')
    .insert({ ...filaDesdeValores(valores), columna_id: columnaPendiente, estado: 'pendiente' })
    .select('id')
    .single();
  if (nueva.error) throw traducir(nueva.error, 'No se pudo crear la tarea');
  const id = nueva.data.id as string;

  const items = itemsLimpios(valores);
  if (items.length > 0) {
    const res = await sb
      .from('checklist_items')
      .insert(items.map((i, orden) => ({ tarea_id: id, descripcion: i.descripcion, orden })));
    if (res.error) {
      // Sin checklist la tarea quedaría a medias: deshacer
      await sb.from('tareas').delete().eq('id', id);
      throw traducir(res.error, 'No se pudo guardar el checklist');
    }
  }
  return id;
}

// Actualiza los datos de la tarea y sincroniza su checklist (agrega, renombra y borra ítems)
export async function editarTarea(id: string, valores: ValoresTarea, checklistActual: ChecklistItem[]): Promise<void> {
  const sb = cliente();

  const res = await sb.from('tareas').update(filaDesdeValores(valores)).eq('id', id);
  if (res.error) throw traducir(res.error, 'No se pudo guardar la tarea');

  const items = itemsLimpios(valores);
  const conservados = new Set(items.filter((i) => i.id).map((i) => i.id));
  const borrados = checklistActual.filter((i) => !conservados.has(i.id)).map((i) => i.id);

  if (borrados.length > 0) {
    const r = await sb.from('checklist_items').delete().in('id', borrados);
    if (r.error) throw traducir(r.error, 'No se pudo actualizar el checklist');
  }

  for (const [orden, item] of items.entries()) {
    const r = item.id
      ? await sb.from('checklist_items').update({ descripcion: item.descripcion, orden }).eq('id', item.id)
      : await sb.from('checklist_items').insert({ tarea_id: id, descripcion: item.descripcion, orden });
    if (r.error) throw traducir(r.error, 'No se pudo actualizar el checklist');
  }
}

// Mover de columna. Al pasar a "terminado" el trigger exige checklist completo + 1 foto.
export async function moverTarea(id: string, estado: Estado, columnaId: string): Promise<void> {
  const res = await cliente().from('tareas').update({ estado, columna_id: columnaId }).eq('id', id).select('id');
  if (res.error) throw traducir(res.error, 'No se pudo mover la tarea');
  // Con RLS, un UPDATE sin permiso no da error: simplemente no cambia filas
  if (res.data?.length === 0) throw new Error('No tienes permiso para mover esta tarea');
}

export async function eliminarTarea(id: string, rutasEvidencia: string[]): Promise<void> {
  const sb = cliente();
  // Checklist, evidencias y actividad se borran en cascada
  const res = await sb.from('tareas').delete().eq('id', id);
  if (res.error) throw traducir(res.error, 'No se pudo eliminar la tarea');
  // Las fotos del bucket no se borran solas
  if (rutasEvidencia.length > 0) await sb.storage.from(BUCKET).remove(rutasEvidencia);
}

export async function marcarItem(id: string, completado: boolean): Promise<void> {
  const res = await cliente().from('checklist_items').update({ completado }).eq('id', id).select('id');
  if (res.error) throw traducir(res.error, 'No se pudo actualizar el checklist');
  if (res.data?.length === 0) throw new Error('No tienes permiso para modificar este checklist');
}

// ---------------------------------------------------------------------------
// Evidencias (bucket privado "evidencias", ruta <tarea_id>/<timestamp>.<ext>)
// ---------------------------------------------------------------------------

const EXTENSIONES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function subirEvidencia(tareaId: string, uri: string, tipo = 'image/jpeg'): Promise<Evidencia> {
  const sb = cliente();
  // El bucket solo acepta jpeg, png y webp
  const contentType = EXTENSIONES[tipo] ? tipo : 'image/jpeg';
  const ruta = `${tareaId}/${Date.now()}.${EXTENSIONES[contentType]}`;

  // Se lee el archivo local con expo-file-system: fetch(file://...) en React Native puede
  // devolver un cuerpo vacío y la foto queda subida con 0 bytes (se registra pero no se ve)
  let cuerpo: ArrayBuffer;
  try {
    cuerpo = await new File(uri).arrayBuffer();
  } catch {
    throw new Error('No se pudo leer la foto');
  }
  if (cuerpo.byteLength === 0) throw new Error('La foto quedó vacía, intenta tomarla de nuevo');

  const subida = await sb.storage.from(BUCKET).upload(ruta, cuerpo, { contentType, upsert: false });
  if (subida.error) throw traducir(subida.error, 'No se pudo subir la foto');

  const fila = await sb
    .from('evidencias')
    .insert({ tarea_id: tareaId, url_foto: ruta })
    .select('id, tarea_id, url_foto, fecha')
    .single();
  if (fila.error) {
    await sb.storage.from(BUCKET).remove([ruta]);
    throw traducir(fila.error, 'No se pudo guardar la evidencia');
  }
  return aEvidencia(fila.data as FilaEvidencia);
}

export async function eliminarEvidencia(id: string, ruta: string): Promise<void> {
  const sb = cliente();
  const res = await sb.from('evidencias').delete().eq('id', id).select('id');
  if (res.error) throw traducir(res.error, 'No se pudo eliminar la foto');
  // Con RLS un borrado sin permiso no da error: simplemente no borra filas
  if (res.data.length === 0) throw new Error('No tienes permiso para hacer esto');
  // El archivo se borra después de la fila; si falla solo queda un archivo huérfano en el bucket
  if (!esUrlDirecta(ruta)) await sb.storage.from(BUCKET).remove([ruta]);
  cache.delete(ruta);
}

// URLs firmadas (el bucket es privado). Se guardan en memoria hasta poco antes de vencer.
const DURACION = 60 * 60; // segundos
const cache = new Map<string, { url: string; vence: number }>();

export const esUrlDirecta = (ruta: string) => /^(https?:|file:|blob:|data:|content:|ph:)/.test(ruta);

export async function firmarEvidencias(rutas: string[]): Promise<Record<string, string>> {
  const ahora = Date.now();
  const resultado: Record<string, string> = {};
  const pendientes: string[] = [];

  for (const ruta of rutas) {
    if (esUrlDirecta(ruta)) resultado[ruta] = ruta;
    else {
      const guardada = cache.get(ruta);
      if (guardada && guardada.vence > ahora) resultado[ruta] = guardada.url;
      else pendientes.push(ruta);
    }
  }

  if (pendientes.length > 0 && supabase) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(pendientes, DURACION);
    if (error) throw traducir(error, 'No se pudieron cargar las fotos');
    const fallidas = data.filter((f) => !f.signedUrl || !f.path);
    if (fallidas.length > 0)
      console.warn(
        'Fotos sin URL firmada:',
        fallidas.map((f) => `${f.path}: ${f.error}`),
      );
    for (const f of data) {
      if (!f.signedUrl || !f.path) continue;
      resultado[f.path] = f.signedUrl;
      cache.set(f.path, { url: f.signedUrl, vence: ahora + (DURACION - 300) * 1000 });
    }
  }
  return resultado;
}
