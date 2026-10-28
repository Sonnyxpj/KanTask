import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Checklist } from '@/components/tarea/Checklist';
import { Evidencias } from '@/components/tarea/Evidencias';
import { Avatar } from '@/components/ui/Avatar';
import { Boton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio } from '@/constants/colores';
import { CHECKLIST, EVIDENCIAS, TAREAS } from '@/constants/datos-demo';
import { COLUMNAS, PRIORIDADES } from '@/constants/estados';
import { useEquipo } from '@/lib/equipo';

// Pantalla 3 · Detalle de tarea
export default function DetalleTarea() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buscarUsuario } = useEquipo();
  const tarea = TAREAS.find((t) => t.id === id) ?? TAREAS[0];
  const [items, setItems] = useState(() => CHECKLIST.filter((c) => c.tareaId === tarea.id));
  const fotos = EVIDENCIAS.filter((e) => e.tareaId === tarea.id);

  const prioridad = PRIORIDADES[tarea.prioridad];
  const responsable = buscarUsuario(tarea.asignadoA);
  const columna = COLUMNAS.find((c) => c.estado === tarea.estado);
  const terminada = tarea.estado === 'terminado';
  // Para cerrar la tarea: checklist completo y al menos una foto de evidencia
  const puedeCompletar = items.every((i) => i.completado) && fotos.length > 0;

  const alternar = (itemId: string) =>
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, completado: !i.completado } : i)));

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <View style={styles.barra}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icono nombre="atras" />
        </Pressable>
        <Text style={styles.barraTitulo}>Detalle de tarea</Text>
        <Icono nombre="opciones" color={Colores.textoSecundario} />
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.cabecera}>
          <View style={styles.etiquetas}>
            <Text style={[styles.prioridad, { color: prioridad.color, backgroundColor: prioridad.fondo }]}>
              Prioridad {prioridad.etiqueta.toLowerCase()}
            </Text>
            {columna && (
              <View style={styles.estado}>
                <View style={[styles.punto, { backgroundColor: columna.color }]} />
                <Text style={styles.estadoTexto}>{columna.nombre}</Text>
              </View>
            )}
          </View>
          <Text style={styles.titulo}>{tarea.titulo}</Text>
          <Text style={styles.descripcion}>{tarea.descripcion}</Text>
        </View>

        <View style={styles.meta}>
          {responsable && (
            <View style={styles.metaFila}>
              <Avatar nombre={responsable.nombre} tamano={24} />
              <Text style={styles.metaTexto}>Asignado a {responsable.nombre}</Text>
            </View>
          )}
          <View style={styles.metaFila}>
            <Icono nombre="reloj" tamano={16} color={Colores.primario} />
            <Text style={[styles.metaTexto, { color: Colores.primario }]}>Fecha límite · {tarea.fechaLimite}</Text>
          </View>
        </View>

        <Checklist items={items} onToggle={terminada ? undefined : alternar} />

        <Evidencias fotos={fotos} puedeAgregar={!terminada} onAgregar={() => router.push('/camera')} />
      </ScrollView>

      {!terminada && (
        <View style={styles.acciones}>
          <Boton titulo="Guardar progreso" variante="secundario" estilo={styles.flex} onPress={() => router.back()} />
          <Boton titulo="Completar tarea" deshabilitado={!puedeCompletar} estilo={styles.flex} onPress={() => router.back()} />
        </View>
      )}
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
  barraTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colores.texto,
  },
  contenido: {
    padding: Espacio.lg,
    gap: Espacio.xl,
  },
  cabecera: {
    gap: Espacio.sm,
  },
  etiquetas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
  },
  prioridad: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: Espacio.sm,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.xs,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  estadoTexto: {
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '500',
    color: Colores.texto,
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 20,
    color: Colores.textoSecundario,
  },
  meta: {
    gap: Espacio.sm,
    marginTop: -Espacio.sm,
  },
  metaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
  },
  metaTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.texto,
  },
  acciones: {
    flexDirection: 'row',
    gap: Espacio.md,
    padding: Espacio.lg,
    borderTopWidth: 1,
    borderTopColor: Colores.borde,
    backgroundColor: Colores.fondo,
  },
});
