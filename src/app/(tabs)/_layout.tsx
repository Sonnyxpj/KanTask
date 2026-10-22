import { Tabs } from 'expo-router';

import { Icono } from '@/components/ui/Icono';
import { Colores } from '@/constants/colores';

export default function TabsLayout() {
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
