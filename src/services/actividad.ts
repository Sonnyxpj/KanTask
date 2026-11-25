// Actividad del equipo (la llenan los triggers de supabase/schema.sql) y comentarios con menciones
import { supabase } from '@/lib/supabase';
import type { Actividad, Comentario, TipoActividad } from '@/types/modelos';

type FilaActividad = {
  id: string;
  tipo: TipoActividad;
  texto: string;
  tarea_id: string | null;
  usuario_id: string | null;
  destinatario_id: string | null;
  created_at: string;
};
type FilaComentario = {
  id: string;
  tarea_id: string;
  usuario_id: string;
  texto: string;
  menciones: string[];
  created_at: string;
};

export const aActividad = (f: FilaActividad): Actividad => ({
  id: f.id,
  tipo: f.tipo,
  texto: f.texto,
  tareaId: f.tarea_id ?? undefined,
  usuarioId: f.usuario_id ?? '',
  destinatarioId: f.destinatario_id ?? undefined,
  fecha: f.created_at,
});

export const aComentario = (f: FilaComentario): Comentario => ({
  id: f.id,
  tareaId: f.tarea_id,
  usuarioId: f.usuario_id,
  texto: f.texto,
  menciones: f.menciones ?? [],
  fecha: f.created_at,
});

const LIMITE = 100;

export async function listarActividad(): Promise<Actividad[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('actividad')
    .select('id, tipo, texto, tarea_id, usuario_id, destinatario_id, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMITE);
  if (error)
    throw new Error(error.message.toLowerCase().includes('fetch') ? 'Sin conexión' : 'No se pudo cargar la actividad');
  return (data as FilaActividad[]).map(aActividad);
}

export async function listarComentarios(tareaId: string): Promise<Comentario[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('comentarios')
    .select('id, tarea_id, usuario_id, texto, menciones, created_at')
    .eq('tarea_id', tareaId)
    .order('created_at');
  if (error) {
    // La tabla se crea en la sección 7 de supabase/schema.sql
    if (error.code === '42P01' || error.message.includes('comentarios'))
      throw new Error('Falta crear la tabla de comentarios en Supabase');
    throw new Error('No se pudieron cargar los comentarios');
  }
  return (data as FilaComentario[]).map(aComentario);
}

export async function crearComentario(tareaId: string, texto: string, menciones: string[]): Promise<Comentario> {
  if (!supabase) throw new Error('No hay conexión con el servidor');
  const { data, error } = await supabase
    .from('comentarios')
    .insert({ tarea_id: tareaId, texto: texto.trim(), menciones })
    .select('id, tarea_id, usuario_id, texto, menciones, created_at')
    .single();
  if (error) {
    if (error.message.toLowerCase().includes('fetch')) throw new Error('Sin conexión: no se pudo enviar el comentario');
    throw new Error('No se pudo enviar el comentario');
  }
  return aComentario(data as FilaComentario);
}

export async function borrarComentario(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('comentarios').delete().eq('id', id);
  if (error) throw new Error('No se pudo borrar el comentario');
}
