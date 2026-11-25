// Almacenamiento local persistente (localStorage respaldado por SQLite en iOS/Android,
// el mismo que usa Supabase Auth para la sesión). Sirve para el modo offline y las preferencias.
import 'expo-sqlite/localStorage/install';

export function leer<T>(clave: string): T | null {
  try {
    const texto = localStorage.getItem(clave);
    return texto ? (JSON.parse(texto) as T) : null;
  } catch {
    return null;
  }
}

export function guardar(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando sin caché
  }
}

export function borrar(clave: string): void {
  try {
    localStorage.removeItem(clave);
  } catch {}
}

// Claves usadas en la app
export const Claves = {
  tablero: (usuario: string) => `kantask.cache.tablero.${usuario}`,
  equipo: (usuario: string) => `kantask.cache.equipo.${usuario}`,
  actividad: (usuario: string) => `kantask.cache.actividad.${usuario}`,
  actividadVista: (usuario: string) => `kantask.actividad.vista.${usuario}`,
  notificaciones: 'kantask.pref.notificaciones',
} as const;

// ¿El error parece de red (sin conexión) y no de permisos o datos?
export function esErrorDeRed(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return m.includes('network') || m.includes('fetch') || m.includes('sin conexión') || m.includes('timeout');
}
