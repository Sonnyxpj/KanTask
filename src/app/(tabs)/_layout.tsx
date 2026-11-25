import * as Notifications from 'expo-notifications';
import { router, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Icono } from '@/components/ui/Icono';
import { Colores } from '@/constants/colores';
import { useActividad } from '@/lib/actividad';
import { configurarNotificaciones, pedirPermisoInicial, programarRecordatorios } from '@/lib/notificaciones';
import { useSesion } from '@/lib/sesion';
import { useTablero } from '@/lib/tablero';

// Solo se monta con sesión iniciada
export default function TabsLayout() {
  const { noLeidas } = useActividad();
  useNotificaciones();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colores.primario,
        tabBarInactiveTintColor: Colores.textoTenue,
        tabBarStyle: { backgroundColor: Colores.superficie, borderTopColor: Colores.borde },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: Colores.fondo },
      }}>
      <Tabs.Screen
        name="tablero"
        options={{
          title: 'Tablero',
          tabBarIcon: ({ color }) => <Icono nombre="tablero" color={color} tamano={22} />,
        }}
      />
      <Tabs.Screen
        name="equipo/index"
        options={{
          title: 'Equipo',
          tabBarIcon: ({ color }) => <Icono nombre="equipo" color={color} tamano={22} />,
        }}
      />
      <Tabs.Screen
        name="actividad/index"
        options={{
          title: 'Actividad',
          tabBarBadge: noLeidas > 0 ? (noLeidas > 9 ? '9+' : noLeidas) : undefined,
          tabBarBadgeStyle: { backgroundColor: Colores.peligro, fontSize: 10 },
          tabBarIcon: ({ color }) => <Icono nombre="actividad" color={color} tamano={22} />,
        }}
      />
      <Tabs.Screen
        name="perfil/index"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Icono nombre="perfil" color={color} tamano={22} />,
        }}
      />
    </Tabs>
  );
}

// Permisos, recordatorios de vencimiento y apertura de la tarea al tocar un aviso
function useNotificaciones() {
  const { sesion } = useSesion();
  const { tareas } = useTablero();
  const idUsuario = sesion?.user.id;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    configurarNotificaciones();
    pedirPermisoInicial().catch(() => {});

    const abrir = (respuesta: Notifications.NotificationResponse | null) => {
      const tareaId = respuesta?.notification.request.content.data?.tareaId;
      if (typeof tareaId === 'string') router.push({ pathname: '/tablero/[id]', params: { id: tareaId } });
    };
    // Si la app se abrió tocando una notificación
    abrir(Notifications.getLastNotificationResponse());
    Notifications.clearLastNotificationResponse();

    const suscripcion = Notifications.addNotificationResponseReceivedListener(abrir);
    return () => suscripcion.remove();
  }, []);

  // Reagendar recordatorios cuando cambian las tareas (agrupando cambios seguidos)
  useEffect(() => {
    if (Platform.OS === 'web' || !idUsuario) return;
    const temporizador = setTimeout(() => programarRecordatorios(tareas, idUsuario).catch(() => {}), 1000);
    return () => clearTimeout(temporizador);
  }, [tareas, idUsuario]);
}
