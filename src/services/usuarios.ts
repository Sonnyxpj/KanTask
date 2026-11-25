// Perfil público del usuario (tabla public.usuarios, creada por el trigger crear_perfil_usuario)
import { supabase } from '@/lib/supabase';
import type { Rol, Usuario } from '@/types/modelos';

type FilaUsuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  turno: string | null;
  cargo: string | null;
  telefono: string | null;
};

const aUsuario = (f: FilaUsuario): Usuario => ({
  id: f.id,
  nombre: f.nombre,
  correo: f.correo,
  rol: f.rol,
  turno: f.turno ?? '',
  enVivo: false, // se calcula con Realtime Presence en src/lib/equipo.tsx
  cargo: f.cargo ?? undefined,
  telefono: f.telefono ?? undefined,
});

const COLUMNAS = 'id, nombre, correo, rol, turno, cargo, telefono';

// Integrantes del equipo (Pantalla 5)
export async function listarUsuarios(): Promise<Usuario[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.from('usuarios').select(COLUMNAS).order('nombre');
  if (error) throw new Error('No se pudo cargar el equipo');
  return (data as FilaUsuario[]).map(aUsuario);
}

export type CambiosPerfil = { nombre: string; telefono?: string };

export async function actualizarPerfil(id: string, cambios: CambiosPerfil): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('usuarios')
    .update({ nombre: cambios.nombre.trim(), telefono: cambios.telefono?.trim() || null })
    .eq('id', id);

  if (error) throw new Error('No se pudo guardar tu perfil');
}

// Supabase envía un enlace de confirmación; el correo cambia recién al confirmarlo
// y el trigger al_cambiar_correo_usuario lo copia a public.usuarios
export async function cambiarCorreo(nuevo: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.auth.updateUser({ email: nuevo.trim().toLowerCase() });
  if (!error) return;

  const mensaje = error.message.toLowerCase();
  if (mensaje.includes('already been registered') || mensaje.includes('already registered'))
    throw new Error('Ya existe una cuenta con ese correo');
  if (mensaje.includes('rate limit') || mensaje.includes('security purposes'))
    throw new Error('Demasiados intentos, espera un momento');
  if (mensaje.includes('error sending')) throw new Error('No se pudo enviar el correo de confirmación');
  throw new Error('No se pudo cambiar el correo');
}

// Solo editores, y no sobre sí mismos (lo valida la función cambiar_rol en supabase/schema.sql)
export async function cambiarRol(id: string, rol: Rol): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.rpc('cambiar_rol', { p_usuario: id, p_rol: rol });
  if (!error) return;

  if (error.message.includes('Solo los editores')) throw new Error('Solo los editores pueden cambiar roles');
  if (error.message.includes('propio rol')) throw new Error('No puedes cambiar tu propio rol');
  throw new Error('No se pudo cambiar el rol');
}
