import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormTarea } from '@/components/tarea/FormTarea';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio } from '@/constants/colores';

// Formulario "Agregar tarea"
export default function NuevaTarea() {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.pantalla}>
      <View style={styles.barra}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icono nombre="cerrar" />
        </Pressable>
        <Text style={styles.titulo}>Nueva tarea</Text>
        <View style={styles.hueco} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <FormTarea onGuardar={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  flex: {
    flex: 1,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espacio.lg,
    paddingVertical: Espacio.md,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colores.texto,
  },
  hueco: {
    width: 20,
  },
  contenido: {
    padding: Espacio.lg,
    paddingBottom: Espacio.xxl,
  },
});
