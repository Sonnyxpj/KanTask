// Invitaciones al equipo: un editor registra correo, nombre y rol de la persona.
// Cuando esa persona se registra con ese correo, el trigger crear_perfil_usuario
// (supabase/schema.sql) le asigna el rol y cargo de su invitación.
import { USUARIOS } from '@/constants/datos-demo';
import { supabase } from '@/lib/supabase';
import type { Invitacion, Rol } from '@/types/modelos';

export type NuevaInvitacion = {
  nombre: string;
  correo: string;
  rol: Rol;
  cargo?: string;
};

type FilaInvitacion = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  cargo: string | null;
  created_at: string;
};

const aInvitacion = (f: FilaInvitacion): Invitacion => ({
  id: f.id,
  nombre: f.nombre,
  correo: f.correo,
  rol: f.rol,
  cargo: f.cargo ?? undefined,
  fecha: f.created_at,
});

// Modo demo: invitaciones en memoria mientras no haya backend
let invitacionesDemo: Invitacion[] = [];

export async function listarInvitaciones(): Promise<Invitacion[]> {
  if (!supabase) return invitacionesDemo;

  const { data, error } = await supabase
    .from('invitaciones')
    .select('id, nombre, correo, rol, cargo, created_at')
    .is('aceptada_en', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error('No se pudieron cargar las invitaciones');
  return (data as FilaInvitacion[]).map(aInvitacion);
}

export async function invitarMiembro(datos: NuevaInvitacion): Promise<Invitacion> {
  const correo = datos.correo.trim().toLowerCase();
  const nombre = datos.nombre.trim();
  const cargo = datos.cargo?.trim() || undefined;

  if (!supabase) {
    const yaExiste =
      USUARIOS.some((u) => u.correo.toLowerCase() === correo) ||
      invitacionesDemo.some((i) => i.correo === correo);
    if (yaExiste) throw new Error('Esa persona ya es parte del equipo o ya fue invitada');
    const nueva: Invitacion = { id: `inv-${Date.now()}`, nombre, correo, rol: datos.rol, cargo, fecha: new Date().toISOString() };
    invitacionesDemo = [nueva, ...invitacionesDemo];
    return nueva;
  }

  const { data: existente } = await supabase.from('usuarios').select('id').eq('correo', correo).maybeSingle();
  if (existente) throw new Error('Esa persona ya es parte del equipo');

  const { data, error } = await supabase
    .from('invitaciones')
    .insert({ correo, nombre, rol: datos.rol, cargo: cargo ?? null })
    .select('id, nombre, correo, rol, cargo, created_at')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Ese correo ya tiene una invitación pendiente');
    if (error.code === '42501') throw new Error('Solo los editores pueden invitar integrantes');
    throw new Error('No se pudo enviar la invitación');
  }
  return aInvitacion(data as FilaInvitacion);
}

export async function cancelarInvitacion(id: string): Promise<void> {
  if (!supabase) {
    invitacionesDemo = invitacionesDemo.filter((i) => i.id !== id);
    return;
  }
  const { error } = await supabase.from('invitaciones').delete().eq('id', id);
  if (error) throw new Error('No se pudo cancelar la invitación');
}
