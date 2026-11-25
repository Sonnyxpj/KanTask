// Notificaciones locales:
//   · Aviso inmediato cuando llega por Realtime una actividad dirigida a mí (asignación, mención…)
//   · Recordatorio 1 hora antes de la fecha límite de mis tareas abiertas
// Son locales (las agenda el propio teléfono). Los avisos con la app cerrada por completo
// requerirían push remoto (tokens + Edge Function), que queda fuera de este alcance.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Claves, guardar, leer } from '@/lib/almacen';
import type { Tarea } from '@/types/modelos';

const SOPORTADO = Platform.OS !== 'web';
const PREFIJO_RECORDATORIO = 'vence-';
const ANTICIPACION_MS = 60 * 60 * 1000;

let configurado = false;

export function configurarNotificaciones() {
  if (!SOPORTADO || configurado) return;
  configurado = true;
  // Mostrar el aviso también con la app abierta
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Preferencia del interruptor "Notificaciones" del Perfil (activas por defecto)
export function notificacionesActivas(): boolean {
  return leer<boolean>(Claves.notificaciones) ?? true;
}

async function tienePermiso(): Promise<boolean> {
  if (!SOPORTADO) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

// Activa o desactiva. Al activar pide permiso; devuelve si quedaron activas.
export async function cambiarNotificaciones(activas: boolean): Promise<boolean> {
  if (!activas) {
    guardar(Claves.notificaciones, false);
    if (SOPORTADO) await cancelarRecordatorios();
    return false;
  }
  if (!SOPORTADO) {
    guardar(Claves.notificaciones, true);
    return true;
  }
  const permiso = (await tienePermiso()) || (await Notifications.requestPermissionsAsync()).granted;
  guardar(Claves.notificaciones, permiso);
  return permiso;
}

// Pide permiso una vez al entrar (si el usuario no las desactivó)
export async function pedirPermisoInicial() {
  if (!SOPORTADO || !notificacionesActivas()) return;
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  if (!granted && canAskAgain) await Notifications.requestPermissionsAsync();
}

export async function avisar(titulo: string, cuerpo: string, tareaId?: string) {
  if (!notificacionesActivas() || !(await tienePermiso())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: cuerpo, data: tareaId ? { tareaId } : {} },
    trigger: null,
  });
}

async function cancelarRecordatorios() {
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    agendadas
      .filter((n) => n.identifier.startsWith(PREFIJO_RECORDATORIO))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// Reagenda los recordatorios de vencimiento de las tareas abiertas asignadas a mí
export async function programarRecordatorios(tareas: Tarea[], idUsuario: string) {
  if (!SOPORTADO) return;
  await cancelarRecordatorios();
  if (!notificacionesActivas() || !(await tienePermiso())) return;

  const ahora = Date.now();
  const mias = tareas.filter((t) => t.asignadoA === idUsuario && t.estado !== 'terminado');
  for (const tarea of mias) {
    const cuando = new Date(tarea.fechaLimite).getTime() - ANTICIPACION_MS;
    if (Number.isNaN(cuando) || cuando <= ahora) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIJO_RECORDATORIO}${tarea.id}`,
      content: {
        title: 'Tarea por vencer',
        body: `'${tarea.titulo}' vence en 1 hora`,
        data: { tareaId: tarea.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: cuando },
    });
  }
}
