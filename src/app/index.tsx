import { Redirect } from 'expo-router';

import { useSesion } from '@/lib/sesion';

// Ruta raíz: Stack.Protected vuelve aquí cuando cambia la sesión
export default function Inicio() {
  const { sesion } = useSesion();
  return <Redirect href={sesion ? '/tablero' : '/login'} />;
}
