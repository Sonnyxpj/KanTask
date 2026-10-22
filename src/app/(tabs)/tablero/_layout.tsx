import { Stack } from 'expo-router';

import { Colores } from '@/constants/colores';

export default function TableroLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.fondo } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="nueva" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
