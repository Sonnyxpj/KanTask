import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colores } from '@/constants/colores';
import { ProveedorEquipo } from '@/lib/equipo';
import { ProveedorSesion, useSesion } from '@/lib/sesion';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProveedorSesion>
        <ProveedorEquipo>
          <StatusBar style="dark" />
          <Navegador />
        </ProveedorEquipo>
      </ProveedorSesion>
    </SafeAreaProvider>
  );
}

function Navegador() {
  const { sesion, cargando, modoDemo } = useSesion();

  // Mantener el splash hasta saber si hay una sesión guardada
  if (cargando) return null;
  SplashScreen.hide();

  // En modo demo (sin backend) todas las pantallas quedan accesibles
  const conSesion = modoDemo || !!sesion;
  const sinSesion = modoDemo || !sesion;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.fondo } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={sinSesion}>
        <Stack.Screen name="login" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="recuperar" />
      </Stack.Protected>
      <Stack.Protected guard={conSesion}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal' }} />
      </Stack.Protected>
    </Stack>
  );
}
