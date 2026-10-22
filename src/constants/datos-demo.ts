// Datos de ejemplo para maquetar las pantallas mientras no exista el backend (Supabase).
import type { ChecklistItem, Evidencia, Tarea, Usuario } from '@/types/modelos';

export const USUARIO_ACTUAL: Usuario = {
  id: 'u1',
  nombre: 'Benjamín Garrido',
  correo: 'benjamin@kantask.dev',
  rol: 'editor',
  turno: 'Sprint 4',
  enVivo: true,
  cargo: 'Líder técnico',
  telefono: '+56 9 1234 5678',
};

export const USUARIOS: Usuario[] = [
  USUARIO_ACTUAL,
  { id: 'u2', nombre: 'Iván Sánchez', correo: 'ivan@kantask.dev', rol: 'editor', turno: 'Sprint 4', enVivo: true, cargo: 'Backend' },
  { id: 'u3', nombre: 'Camila Rojas', correo: 'camila@kantask.dev', rol: 'editor', turno: 'Sprint 4', enVivo: true, cargo: 'Frontend' },
  { id: 'u4', nombre: 'Matías Pérez', correo: 'matias@kantask.dev', rol: 'visualizador', turno: 'Sprint 4', enVivo: false, cargo: 'Product owner' },
  { id: 'u5', nombre: 'Valentina Soto', correo: 'valentina@kantask.dev', rol: 'editor', turno: 'Sprint 4', enVivo: true, cargo: 'QA' },
];

export const TAREAS: Tarea[] = [
  {
    id: 't1',
    columnaId: 'c1',
    asignadoA: 'u2',
    titulo: 'Configurar Supabase Auth',
    descripcion: 'Crear el proyecto en Supabase, habilitar el inicio de sesión con correo y probar el flujo desde la app.',
    prioridad: 'alta',
    fechaLimite: 'Hoy · 11:30',
    estado: 'pendiente',
  },
  {
    id: 't2',
    columnaId: 'c1',
    asignadoA: 'u3',
    titulo: 'Diseñar pantalla de perfil',
    descripcion: 'Maquetar la vista de perfil con datos del usuario, ajustes y cierre de sesión.',
    prioridad: 'baja',
    fechaLimite: 'Hoy · 14:00',
    estado: 'pendiente',
  },
  {
    id: 't3',
    columnaId: 'c2',
    asignadoA: 'u1',
    titulo: 'Tablero Kanban horizontal',
    descripcion: 'Implementar las columnas con desplazamiento horizontal y tarjetas con prioridad y fecha.',
    prioridad: 'media',
    fechaLimite: 'Hoy · 12:15',
    estado: 'en_progreso',
  },
  {
    id: 't4',
    columnaId: 'c2',
    asignadoA: 'u5',
    titulo: 'Corregir error al subir foto',
    descripcion: 'La subida de evidencia falla cuando la imagen supera los 5 MB. Comprimir antes de subir.',
    prioridad: 'alta',
    fechaLimite: 'Mañana · 10:00',
    estado: 'en_progreso',
  },
  {
    id: 't5',
    columnaId: 'c3',
    asignadoA: 'u2',
    titulo: 'Modelo de datos en draw.io',
    descripcion: 'Definir entidades Usuario, Tablero, Columna, Tarea, Checklist_Item y Evidencia.',
    prioridad: 'media',
    fechaLimite: 'Ayer · 18:00',
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
  { id: 'e1', tareaId: 't1', urlFoto: 'https://picsum.photos/seed/kantask-1/400/400', fecha: 'Hoy · 09:12' },
  { id: 'e2', tareaId: 't1', urlFoto: 'https://picsum.photos/seed/kantask-2/400/400', fecha: 'Hoy · 09:40' },
  { id: 'e3', tareaId: 't5', urlFoto: 'https://picsum.photos/seed/kantask-3/400/400', fecha: 'Ayer · 17:55' },
];

export type TipoActividad = 'asignacion' | 'cambio' | 'evidencia' | 'completada' | 'mencion';

export type Actividad = {
  id: string;
  tipo: TipoActividad;
  texto: string;
  usuarioId: string;
  hace: string;
  accion: string;
  tareaId?: string;
};

export const ACTIVIDAD: Actividad[] = [
  { id: 'a1', tipo: 'asignacion', texto: "Se te asignó 'Tablero Kanban horizontal'", usuarioId: 'u2', hace: 'Hace 2 min', accion: 'Ver tarea', tareaId: 't3' },
  { id: 'a2', tipo: 'cambio', texto: "'Corregir error al subir foto' pasó a En progreso", usuarioId: 'u5', hace: 'Hace 18 min', accion: 'Ver tarea', tareaId: 't4' },
  { id: 'a3', tipo: 'evidencia', texto: 'Nueva evidencia en Configurar Supabase Auth', usuarioId: 'u2', hace: 'Hace 42 min', accion: 'Abrir prueba', tareaId: 't1' },
  { id: 'a4', tipo: 'completada', texto: 'Modelo de datos en draw.io completada', usuarioId: 'u2', hace: 'Hace 1 hora', accion: 'Ver detalles', tareaId: 't5' },
  { id: 'a5', tipo: 'mencion', texto: 'Camila te mencionó en Diseñar pantalla de perfil', usuarioId: 'u3', hace: 'Hace 2 horas', accion: 'Responder', tareaId: 't2' },
];

export function buscarUsuario(id: string) {
  return USUARIOS.find((u) => u.id === id);
}

export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
