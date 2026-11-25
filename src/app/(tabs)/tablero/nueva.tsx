import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormTarea } from '@/components/tarea/FormTarea';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio } from '@/constants/colores';
import { useEquipo } from '@/lib/equipo';
import { useTablero } from '@/lib/tablero';
import type { ValoresTarea } from '@/types/modelos';

// Formulario "Agregar tarea" y, con ?id=, "Editar tarea"
export default function NuevaTarea() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { actual } = useEquipo();
  const { tareas, checklist, crearTarea, editarTarea } = useTablero();
  const esEditor = actual?.rol === 'editor';

  const tarea = id ? tareas.find((t) => t.id === id) : undefined;
  const inicial: ValoresTarea | undefined = tarea && {
    titulo: tarea.titulo,
    descripcion: tarea.descripcion,
    prioridad: tarea.prioridad,
    fechaLimite: tarea.fechaLimite,
    asignadoA: tarea.asignadoA,
    checklist: checklist.filter((i) => i.tareaId === tarea.id).map((i) => ({ id: i.id, descripcion: i.descripcion })),
  };

  const guardar = async (valores: ValoresTarea) => {
    if (tarea) await editarTarea(tarea.id, valores);
    else await crearTarea(valores);
    router.back();
  };

  let aviso = '';
  if (!esEditor) aviso = 'Solo los editores pueden crear o editar tareas.';
  else if (id && !tarea) aviso = 'La tarea ya no existe.';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.pantalla}>
      <View style={styles.barra}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icono nombre="cerrar" />
        </Pressable>
        <Text style={styles.titulo}>{id ? 'Editar tarea' : 'Nueva tarea'}</Text>
        <View style={styles.hueco} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          {aviso ? (
            <Text style={styles.aviso}>{aviso}</Text>
          ) : (
            <FormTarea
              key={tarea?.id ?? 'nueva'}
              inicial={inicial}
              textoBoton={tarea ? 'Guardar cambios' : 'Crear tarea'}
              onGuardar={guardar}
            />
          )}
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
  aviso: {
    fontSize: 14,
    color: Colores.textoSecundario,
    textAlign: 'center',
    marginTop: Espacio.xl,
  },
  contenido: {
    padding: Espacio.lg,
    paddingBottom: Espacio.xxl,
  },
});
