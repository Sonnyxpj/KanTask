// Tipos del modelo de datos (ver "Modelo de Datos" en el informe)

export type Rol = 'editor' | 'visualizador';
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

export type Invitacion = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  cargo?: string;
  fecha: string;
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
  fechaLimite: string;
  estado: Estado;
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
  urlFoto: string;
  fecha: string;
};
