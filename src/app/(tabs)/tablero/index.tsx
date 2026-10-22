import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Columna } from '@/components/kanban/Columna';
import { TarjetaTarea } from '@/components/kanban/TarjetaTarea';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeEnVivo } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { CHECKLIST, TAREAS, USUARIO_ACTUAL, USUARIOS } from '@/constants/datos-demo';
import { COLUMNAS } from '@/constants/estados';

// Pantalla 2 · Tablero Kanban
export default function Tablero() {
  const { width } = useWindowDimensions();
  const anchoColumna = Math.min(280, width * 0.72);

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <Encabezado
        titulo="Tablero de hoy"
        subtitulo="KanTask · Equipo de desarrollo"
        accion={<Icono nombre="opciones" color={Colores.textoSecundario} />}
      />

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.sprint}>
          <View style={styles.sprintFila}>
            <View>
              <Text style={styles.sprintEtiqueta}>SPRINT ACTIVO</Text>
              <Text style={styles.sprintTitulo}>{USUARIO_ACTUAL.turno} · 20 – 31 oct</Text>
            </View>
            <BadgeEnVivo texto="En curso" />
          </View>
          <View style={styles.sprintFila}>
            <Text style={styles.sprintLider}>Líder del equipo · {USUARIO_ACTUAL.nombre}</Text>
            <View style={styles.avatares}>
              {USUARIOS.slice(0, 4).map((u, i) => (
                <View key={u.id} style={i > 0 && styles.avatarSolapado}>
                  <Avatar nombre={u.nombre} tamano={28} borde={Colores.marino} />
                </View>
              ))}
            </View>
          </View>
        </View>

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

      <Boton
        titulo="Agregar tarea"
        icono="mas"
        variante="flotante"
        estilo={styles.fab}
        onPress={() => router.push('/tablero/nueva')}
      />
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
  sprint: {
    marginHorizontal: Espacio.lg,
    padding: Espacio.lg,
    borderRadius: Radio.lg,
    backgroundColor: Colores.marino,
    gap: Espacio.md,
  },
  sprintFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sprintEtiqueta: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#A9B8C7',
  },
  sprintTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sprintLider: {
    flex: 1,
    fontSize: 12,
    color: '#C9D4DF',
  },
  avatares: {
    flexDirection: 'row',
  },
  avatarSolapado: {
    marginLeft: -8,
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
