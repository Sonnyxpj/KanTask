import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Columna } from '@/components/kanban/Columna';
import { TarjetaTarea } from '@/components/kanban/TarjetaTarea';
import { Boton } from '@/components/ui/Boton';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio } from '@/constants/colores';
import { CHECKLIST, TAREAS } from '@/constants/datos-demo';
import { COLUMNAS } from '@/constants/estados';
import { useEquipo } from '@/lib/equipo';

// Pantalla 2 · Tablero Kanban
export default function Tablero() {
  const { width } = useWindowDimensions();
  const anchoColumna = Math.min(280, width * 0.72);
  const { actual } = useEquipo();
  const esEditor = actual?.rol === 'editor';

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <Encabezado
        titulo="Tablero de hoy"
        subtitulo="KanTask · Equipo de desarrollo"
        accion={<Icono nombre="opciones" color={Colores.textoSecundario} />}
      />

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.resumen}>
          <Text style={styles.resumenTitulo}>Tareas · {TAREAS.length}</Text>
          <Text style={styles.resumenAyuda}>Deslizar columnas →</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={anchoColumna + Espacio.lg}
          decelerationRate="fast"
          contentContainerStyle={styles.columnas}>
          {COLUMNAS.map((col) => {
            const tareas = TAREAS.filter((t) => t.estado === col.estado);
            return (
              <Columna key={col.estado} nombre={col.nombre} color={col.color} cantidad={tareas.length} ancho={anchoColumna}>
                {tareas.map((tarea) => {
                  const items = CHECKLIST.filter((c) => c.tareaId === tarea.id);
                  return (
                    <TarjetaTarea
                      key={tarea.id}
                      tarea={tarea}
                      completadas={items.filter((c) => c.completado).length}
                      total={items.length}
                      onPress={() => router.push({ pathname: '/tablero/[id]', params: { id: tarea.id } })}
                    />
                  );
                })}
              </Columna>
            );
          })}
        </ScrollView>
      </ScrollView>

      {/* Solo los editores pueden crear tareas */}
      {esEditor && (
        <Boton
          titulo="Agregar tarea"
          icono="mas"
          variante="flotante"
          estilo={styles.fab}
          onPress={() => router.push('/tablero/nueva')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  contenido: {
    paddingBottom: 96,
    gap: Espacio.lg,
  },
  resumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Espacio.lg,
  },
  resumenTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: Colores.texto,
  },
  resumenAyuda: {
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  columnas: {
    paddingHorizontal: Espacio.lg,
    gap: Espacio.lg,
    alignItems: 'flex-start',
  },
  fab: {
    position: 'absolute',
    right: Espacio.lg,
    bottom: Espacio.lg,
  },
});
