// Reglas de negocio puras (sin React ni Supabase), cubiertas por pruebas en __tests__/
import type { Actividad, ChecklistItem, Evidencia, Tarea, Usuario } from '@/types/modelos';

// Quién puede ser responsable de una tarea (lo valida también el trigger validar_responsable_tarea)
export const puedeSerResponsable = (u: Pick<Usuario, 'rol'>) => u.rol === 'editor' || u.rol === 'programador';

// Quién puede avanzar una tarea (checklist, fotos, moverla y completarla): los Editores
// cualquiera; los Programadores solo las que tienen asignadas. Igual que las políticas RLS.
export function puedeTrabajarTarea(
  usuario: Pick<Usuario, 'id' | 'rol'> | null | undefined,
  tarea: Pick<Tarea, 'asignadoA'>,
) {
  if (!usuario) return false;
  if (usuario.rol === 'editor') return true;
  return usuario.rol === 'programador' && tarea.asignadoA === usuario.id;
}

// Regla de cierre (la misma que aplica el trigger validar_cierre_tarea en la BD):
// checklist completo y al menos una foto de evidencia
export function motivoNoCierre(items: ChecklistItem[], fotos: Evidencia[]): string | null {
  if (items.some((i) => !i.completado)) return 'Completa todos los ítems del checklist';
  if (fotos.length === 0) return 'Agrega al menos una foto de evidencia';
  return null;
}

// Texto personalizado: "Se te asignó…" si soy el destinatario, "…a Camila" si no
export function textoActividad(
  a: Actividad,
  idActual: string | undefined,
  buscar: (id: string) => Usuario | undefined,
) {
  if (a.tipo !== 'asignacion' || !a.destinatarioId) return a.texto;
  if (a.destinatarioId === idActual) return a.texto.replace(/^Se asignó/, 'Se te asignó');
  const destinatario = buscar(a.destinatarioId);
  return destinatario ? `${a.texto} a ${destinatario.nombre.split(' ')[0]}` : a.texto;
}
