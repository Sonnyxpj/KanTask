// Tipos del modelo de datos (ver "Modelo de Datos" en el informe)

export type Rol = 'editor' | 'programador' | 'visualizador';
export type Prioridad = 'alta' | 'media' | 'baja';
export type Estado = 'pendiente' | 'en_progreso' | 'terminado';

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  turno: string;
  enVivo: boolean;
  cargo?: string;
  telefono?: string;
};

export type Tablero = {
  id: string;
  nombre: string;
  equipo: string;
  usuario: string;
};

export type Columna = {
  id: string;
  tableroId: string;
  nombre: string;
  orden: number;
};

export type Tarea = {
  id: string;
  columnaId: string;
  asignadoA: string;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  fechaLimite: string; // ISO 8601 (timestamptz en la BD)
  estado: Estado;
};

// Datos que entrega el formulario de tarea (crear / editar)
export type ValoresTarea = {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  fechaLimite: string; // ISO 8601
  asignadoA: string;
  // Ítems del checklist: con id si ya existen en la BD
  checklist: { id?: string; descripcion: string }[];
};

export type ChecklistItem = {
  id: string;
  tareaId: string;
  descripcion: string;
  completado: boolean;
};

export type Evidencia = {
  id: string;
  tareaId: string;
  urlFoto: string; // ruta dentro del bucket "evidencias" (o URL completa en modo demo)
  fecha: string;
};

export type TipoActividad = 'creada' | 'asignacion' | 'cambio' | 'evidencia' | 'completada' | 'mencion';

// Historial del equipo (Pantalla 4), lo escriben los triggers de la BD
export type Actividad = {
  id: string;
  tipo: TipoActividad;
  texto: string;
  tareaId?: string;
  usuarioId: string; // quién hizo el cambio
  destinatarioId?: string; // a quién afecta (asignación / mención)
  fecha: string; // ISO 8601
};

export type Comentario = {
  id: string;
  tareaId: string;
  usuarioId: string;
  texto: string;
  menciones: string[]; // ids de usuarios mencionados con @
  fecha: string; // ISO 8601
};
