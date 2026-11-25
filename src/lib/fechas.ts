// Utilidades de fecha para la fecha límite de las tareas.
// En la BD se guarda como timestamptz (ISO 8601); en el formulario se escribe "DD-MM-AAAA HH:MM".

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const dosDigitos = (n: number) => String(n).padStart(2, '0');

const inicioDelDia = (f: Date) => new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();

// "Hoy · 11:30", "Mañana · 10:00", "Ayer · 18:00" o "24 nov · 09:00"
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;

  const dias = Math.round((inicioDelDia(fecha) - inicioDelDia(new Date())) / 86_400_000);
  const dia =
    dias === 0
      ? 'Hoy'
      : dias === 1
        ? 'Mañana'
        : dias === -1
          ? 'Ayer'
          : `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}${
              fecha.getFullYear() !== new Date().getFullYear() ? ` ${fecha.getFullYear()}` : ''
            }`;
  return `${dia} · ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

export function estaVencida(iso: string): boolean {
  const fecha = new Date(iso);
  return !Number.isNaN(fecha.getTime()) && fecha.getTime() < Date.now();
}

// Date → "DD-MM-AAAA HH:MM" (para precargar el formulario al editar)
export function aTextoFecha(fecha: Date): string {
  return `${dosDigitos(fecha.getDate())}-${dosDigitos(fecha.getMonth() + 1)}-${fecha.getFullYear()} ${dosDigitos(
    fecha.getHours(),
  )}:${dosDigitos(fecha.getMinutes())}`;
}

// "DD-MM-AAAA" o "DD-MM-AAAA HH:MM" → Date. Devuelve null si el formato o la fecha no son válidos
// (p. ej. 31-02-2026). Sin hora se usa el final del día (23:59).
export function leerTextoFecha(texto: string): Date | null {
  const m = texto.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) return null;

  const [dia, mes, anio] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const hora = m[4] !== undefined ? Number(m[4]) : 23;
  const minuto = m[5] !== undefined ? Number(m[5]) : 59;
  if (hora > 23 || minuto > 59) return null;

  const fecha = new Date(anio, mes - 1, dia, hora, minuto);
  // new Date() "corrige" fechas imposibles (31-02 → 03-03); si cambió, no era válida
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return null;
  return fecha;
}

// "Hace un momento", "Hace 5 min", "Hace 2 horas", "Ayer", "Hace 3 días" o la fecha
export function formatearHace(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60_000);
  if (minutos < 1) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}
