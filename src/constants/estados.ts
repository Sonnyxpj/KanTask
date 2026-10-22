import { Colores } from '@/constants/colores';
import type { Estado, Prioridad, Rol } from '@/types/modelos';

export const COLUMNAS: { estado: Estado; nombre: string; color: string }[] = [
  { estado: 'pendiente', nombre: 'Pendientes', color: Colores.alerta },
  { estado: 'en_progreso', nombre: 'En progreso', color: Colores.primario },
  { estado: 'terminado', nombre: 'Terminado', color: Colores.exito },
];

export const PRIORIDADES: Record<Prioridad, { etiqueta: string; color: string; fondo: string }> = {
  alta: { etiqueta: 'Alta', color: Colores.peligro, fondo: Colores.peligroSuave },
  media: { etiqueta: 'Media', color: Colores.alerta, fondo: Colores.alertaSuave },
  baja: { etiqueta: 'Baja', color: Colores.primario, fondo: Colores.primarioSuave },
};

export const ROLES: Record<Rol, { etiqueta: string; color: string; fondo: string }> = {
  editor: { etiqueta: 'Editor', color: Colores.morado, fondo: Colores.moradoSuave },
  visualizador: { etiqueta: 'Visualizador', color: Colores.primario, fondo: Colores.primarioSuave },
};
