// Datos de ejemplo para maquetar las pantallas mientras no exista el backend (Supabase).
// Con Supabase configurado los usuarios vienen de la base de datos (ver src/lib/equipo.tsx).
import type { Actividad, ChecklistItem, Evidencia, Tarea, Usuario } from '@/types/modelos';

// En modo demo la persona que usa la app es 'u1' y es Editor, para poder probar todas las acciones
export const USUARIO_DEMO = 'u1';
export const USUARIOS: Usuario[] = [
  {
    id: 'u1',
    nombre: 'Iván Sánchez',
    correo: 'ivan@kantask.dev',
    rol: 'editor',
    turno: 'Mañana',
    enVivo: true,
    cargo: 'Frontend',
  },
  {
    id: 'u2',
    nombre: 'Benjamín Garrido',
    correo: 'benjamin@kantask.dev',
    rol: 'editor',
    turno: 'Tarde',
    enVivo: true,
    cargo: 'Backend',
  },
  {
    id: 'u3',
    nombre: 'Camila Rojas',
    correo: 'camila@kantask.dev',
    rol: 'visualizador',
    turno: 'Mañana',
    enVivo: false,
  },
  { id: 'u4', nombre: 'Diego Muñoz', correo: 'diego@kantask.dev', rol: 'visualizador', turno: 'Tarde', enVivo: false },
  {
    id: 'u5',
    nombre: 'Valentina Soto',
    correo: 'valentina@kantask.dev',
    rol: 'visualizador',
    turno: 'Mañana',
    enVivo: true,
  },
];

// Fecha ISO relativa a hoy (las fechas límite se guardan como timestamptz)
function enDias(dias: number, hora: number, minuto: number) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, minuto, 0, 0);
  return fecha.toISOString();
}

export const TAREAS: Tarea[] = [
  {
    id: 't1',
    columnaId: 'c1',
    asignadoA: 'u2',
    titulo: 'Configurar Supabase Auth',
    descripcion:
      'Crear el proyecto en Supabase, habilitar el inicio de sesión con correo y probar el flujo desde la app.',
    prioridad: 'alta',
    fechaLimite: enDias(0, 11, 30),
    estado: 'pendiente',
  },
  {
    id: 't2',
    columnaId: 'c1',
    asignadoA: 'u3',
    titulo: 'Diseñar pantalla de perfil',
    descripcion: 'Maquetar la vista de perfil con datos del usuario, ajustes y cierre de sesión.',
    prioridad: 'baja',
    fechaLimite: enDias(0, 14, 0),
    estado: 'pendiente',
  },
  {
    id: 't3',
    columnaId: 'c2',
    asignadoA: 'u1',
    titulo: 'Tablero Kanban horizontal',
    descripcion: 'Implementar las columnas con desplazamiento horizontal y tarjetas con prioridad y fecha.',
    prioridad: 'media',
    fechaLimite: enDias(0, 12, 15),
    estado: 'en_progreso',
  },
  {
    id: 't4',
    columnaId: 'c2',
    asignadoA: 'u5',
    titulo: 'Corregir error al subir foto',
    descripcion: 'La subida de evidencia falla cuando la imagen supera los 5 MB. Comprimir antes de subir.',
    prioridad: 'alta',
    fechaLimite: enDias(1, 10, 0),
    estado: 'en_progreso',
  },
  {
    id: 't5',
    columnaId: 'c3',
    asignadoA: 'u2',
    titulo: 'Modelo de datos en draw.io',
    descripcion: 'Definir entidades Usuario, Tablero, Columna, Tarea, Checklist_Item y Evidencia.',
    prioridad: 'media',
    fechaLimite: enDias(-1, 18, 0),
    estado: 'terminado',
  },
];

export const CHECKLIST: ChecklistItem[] = [
  { id: 'k1', tareaId: 't1', descripcion: 'Crear proyecto en Supabase', completado: true },
  { id: 'k2', tareaId: 't1', descripcion: 'Habilitar proveedor de correo', completado: true },
  { id: 'k3', tareaId: 't1', descripcion: 'Probar inicio de sesión en Android', completado: false },
  { id: 'k4', tareaId: 't1', descripcion: 'Adjuntar captura del flujo', completado: false },
  { id: 'k5', tareaId: 't2', descripcion: 'Boceto en Figma', completado: true },
  { id: 'k6', tareaId: 't2', descripcion: 'Maquetar vista', completado: false },
  { id: 'k7', tareaId: 't2', descripcion: 'Revisar con el equipo', completado: false },
  { id: 'k8', tareaId: 't3', descripcion: 'Columnas con scroll horizontal', completado: true },
  { id: 'k9', tareaId: 't3', descripcion: 'Tarjeta de tarea', completado: true },
  { id: 'k10', tareaId: 't3', descripcion: 'Botón agregar tarea', completado: true },
  { id: 'k11', tareaId: 't3', descripcion: 'Mover entre columnas', completado: false },
  { id: 'k12', tareaId: 't4', descripcion: 'Reproducir el error', completado: true },
  { id: 'k13', tareaId: 't4', descripcion: 'Comprimir imagen', completado: false },
  { id: 'k14', tareaId: 't5', descripcion: 'Diagrama entidad-relación', completado: true },
  { id: 'k15', tareaId: 't5', descripcion: 'Validar con el profesor', completado: true },
];

export const EVIDENCIAS: Evidencia[] = [
  { id: 'e1', tareaId: 't1', urlFoto: 'https://picsum.photos/seed/kantask-1/400/400', fecha: enDias(0, 9, 12) },
  { id: 'e2', tareaId: 't1', urlFoto: 'https://picsum.photos/seed/kantask-2/400/400', fecha: enDias(0, 9, 40) },
  { id: 'e3', tareaId: 't5', urlFoto: 'https://picsum.photos/seed/kantask-3/400/400', fecha: enDias(-1, 17, 55) },
];

// Fecha ISO de hace N minutos
const haceMinutos = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const ACTIVIDAD: Actividad[] = [
  {
    id: 'a1',
    tipo: 'asignacion',
    texto: "Se asignó 'Tablero Kanban horizontal'",
    usuarioId: 'u2',
    destinatarioId: 'u1',
    fecha: haceMinutos(2),
    tareaId: 't3',
  },
  {
    id: 'a2',
    tipo: 'cambio',
    texto: "'Corregir error al subir foto' pasó a En progreso",
    usuarioId: 'u5',
    fecha: haceMinutos(18),
    tareaId: 't4',
  },
  {
    id: 'a3',
    tipo: 'evidencia',
    texto: "Nueva evidencia en 'Configurar Supabase Auth'",
    usuarioId: 'u2',
    fecha: haceMinutos(42),
    tareaId: 't1',
  },
  {
    id: 'a4',
    tipo: 'completada',
    texto: "'Modelo de datos en draw.io' fue completada",
    usuarioId: 'u2',
    fecha: haceMinutos(60),
    tareaId: 't5',
  },
  {
    id: 'a5',
    tipo: 'mencion',
    texto: "Camila te mencionó en 'Diseñar pantalla de perfil'",
    usuarioId: 'u3',
    destinatarioId: 'u1',
    fecha: haceMinutos(120),
    tareaId: 't2',
  },
];

export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
