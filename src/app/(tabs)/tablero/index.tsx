import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Columna } from '@/components/kanban/Columna';
import { ResumenTablero } from '@/components/kanban/ResumenTablero';
import { TarjetaTarea } from '@/components/kanban/TarjetaTarea';
import { Boton } from '@/components/ui/Boton';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { HojaAcciones } from '@/components/ui/HojaAcciones';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { COLUMNAS } from '@/constants/estados';
import { useEquipo } from '@/lib/equipo';
import { formatearHace } from '@/lib/fechas';
import { useTablero } from '@/lib/tablero';
import type { Tarea } from '@/types/modelos';

// Pantalla 2 · Tablero Kanban
export default function Tablero() {
  const { width } = useWindowDimensions();
  const anchoColumna = Math.min(280, width * 0.72);
  const { actual, usuarios, buscarUsuario } = useEquipo();
  const { tablero, tareas, checklist, cargando, error, sinConexion, actualizado, sinTablero, recargar, moverTarea } =
    useTablero();
  const esEditor = actual?.rol === 'editor';

  const [moviendo, setMoviendo] = useState<Tarea | null>(null);
  const [aviso, setAviso] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  const refrescar = async () => {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  };

  const mover = async (tarea: Tarea, estado: Tarea['estado']) => {
    setAviso('');
    try {
      await moverTarea(tarea.id, estado);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No se pudo mover la tarea');
    }
  };

  const subtitulo = tablero ? ['KanTask', tablero.equipo || tablero.nombre].join(' · ') : 'KanTask';
  const mensaje = error || aviso;

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <Encabezado titulo={tablero?.nombre ?? 'Tablero de hoy'} subtitulo={subtitulo} />

      {cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator color={Colores.primario} />
        </View>
      ) : sinTablero ? (
        <View style={styles.centro}>
          <Text style={styles.vacioTitulo}>Aún no hay un tablero</Text>
          <Text style={styles.vacioTexto}>Un editor del equipo debe abrir la app para crearlo.</Text>
          <Boton titulo="Reintentar" variante="secundario" onPress={refrescar} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}>
          {tablero && (
            <ResumenTablero
              equipo={tablero.equipo || tablero.nombre}
              lider={buscarUsuario(tablero.usuario)}
              integrantes={usuarios}
              tareas={tareas}
              sinConexion={sinConexion}
            />
          )}

          {sinConexion && (
            <View style={styles.offline}>
              <Icono nombre="nube" tamano={16} color={Colores.alerta} />
              <Text style={styles.offlineTexto}>
                Sin conexión · mostrando los datos guardados
                {actualizado ? ` (${formatearHace(actualizado).toLowerCase()})` : ''}. Los cambios se podrán hacer al
                volver internet.
              </Text>
            </View>
          )}

          {mensaje ? (
            <Pressable style={styles.error} onPress={() => (error ? refrescar() : setAviso(''))}>
              <Text style={styles.errorTexto}>{mensaje}</Text>
              <Text style={styles.errorAccion}>{error ? 'Reintentar' : 'Cerrar'}</Text>
            </Pressable>
          ) : null}

          <View style={styles.resumen}>
            <Text style={styles.resumenTitulo}>Tareas · {tareas.length}</Text>
            <Text style={styles.resumenAyuda}>
              {esEditor ? 'Mantén presionada una tarea para moverla' : 'Deslizar columnas →'}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={anchoColumna + Espacio.lg}
            decelerationRate="fast"
            contentContainerStyle={styles.columnas}>
            {COLUMNAS.map((col) => {
              const deColumna = tareas.filter((t) => t.estado === col.estado);
              return (
                <Columna
                  key={col.estado}
                  nombre={col.nombre}
                  color={col.color}
                  cantidad={deColumna.length}
                  ancho={anchoColumna}>
                  {deColumna.map((tarea) => {
                    const items = checklist.filter((c) => c.tareaId === tarea.id);
                    return (
                      <TarjetaTarea
                        key={tarea.id}
                        tarea={tarea}
                        completadas={items.filter((c) => c.completado).length}
                        total={items.length}
                        onPress={() => router.push({ pathname: '/tablero/[id]', params: { id: tarea.id } })}
                        onLongPress={esEditor ? () => setMoviendo(tarea) : undefined}
                      />
                    );
                  })}
                </Columna>
              );
            })}
          </ScrollView>
        </ScrollView>
      )}

      {/* Solo los editores pueden crear tareas */}
      {esEditor && !cargando && !sinTablero && (
        <Boton
          titulo="Agregar tarea"
          icono="mas"
          variante="flotante"
          estilo={styles.fab}
          onPress={() => router.push('/tablero/nueva')}
        />
      )}

      <HojaAcciones
        visible={!!moviendo}
        titulo={moviendo ? `Mover "${moviendo.titulo}"` : ''}
        mensaje="Para pasar a Terminado se necesita el checklist completo y al menos una foto."
        acciones={COLUMNAS.filter((c) => c.estado !== moviendo?.estado).map((c) => ({
          etiqueta: `Mover a ${c.nombre}`,
          icono: c.estado === 'terminado' ? 'checkCirculo' : 'intercambio',
          onPress: () => moviendo && mover(moviendo, c.estado),
        }))}
        onCerrar={() => setMoviendo(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.md,
    padding: Espacio.xl,
  },
  vacioTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colores.texto,
  },
  vacioTexto: {
    fontSize: 14,
    color: Colores.textoSecundario,
    textAlign: 'center',
  },
  contenido: {
    paddingBottom: 96,
    gap: Espacio.lg,
  },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
    marginHorizontal: Espacio.lg,
    padding: Espacio.md,
    borderRadius: Radio.md,
    backgroundColor: Colores.alertaSuave,
  },
  offlineTexto: {
    flex: 1,
    fontSize: 12,
    color: Colores.alerta,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    marginHorizontal: Espacio.lg,
    padding: Espacio.md,
    borderRadius: Radio.md,
    backgroundColor: Colores.peligroSuave,
  },
  errorTexto: {
    flex: 1,
    fontSize: 13,
    color: Colores.peligro,
  },
  errorAccion: {
    fontSize: 13,
    fontWeight: '700',
    color: Colores.peligro,
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
