import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Checklist } from '@/components/tarea/Checklist';
import { Comentarios } from '@/components/tarea/Comentarios';
import { Evidencias } from '@/components/tarea/Evidencias';
import { Avatar } from '@/components/ui/Avatar';
import { Boton } from '@/components/ui/Boton';
import { HojaAcciones, type Accion } from '@/components/ui/HojaAcciones';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { COLUMNAS, PRIORIDADES } from '@/constants/estados';
import { useEquipo } from '@/lib/equipo';
import { estaVencida, formatearFecha } from '@/lib/fechas';
import { motivoNoCierre, puedeTrabajarTarea } from '@/lib/reglas';
import { useTablero } from '@/lib/tablero';
import type { Estado } from '@/types/modelos';

// Pantalla 3 · Detalle de tarea
export default function DetalleTarea() {
  const { id, comentar } = useLocalSearchParams<{ id: string; comentar?: string }>();
  const { buscarUsuario, actual } = useEquipo();
  const { tareas, checklist, evidencias, cargando, moverTarea, eliminarTarea, alternarItem, eliminarEvidencia } =
    useTablero();
  const esEditor = actual?.rol === 'editor';

  const [menu, setMenu] = useState<'opciones' | 'eliminar' | null>(null);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const tarea = tareas.find((t) => t.id === id);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/tablero'));

  if (!tarea) {
    return (
      <SafeAreaView edges={['top']} style={styles.pantalla}>
        <BarraSuperior onVolver={volver} />
        <View style={styles.centro}>
          {cargando ? (
            <ActivityIndicator color={Colores.primario} />
          ) : (
            <>
              <Text style={styles.vacioTitulo}>Tarea no encontrada</Text>
              <Text style={styles.vacioTexto}>Es posible que otro integrante la haya eliminado.</Text>
              <Boton titulo="Volver al tablero" variante="secundario" onPress={volver} />
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const items = checklist.filter((c) => c.tareaId === tarea.id);
  const fotos = evidencias.filter((e) => e.tareaId === tarea.id);
  const prioridad = PRIORIDADES[tarea.prioridad];
  const responsable = buscarUsuario(tarea.asignadoA);
  const columna = COLUMNAS.find((c) => c.estado === tarea.estado);
  const terminada = tarea.estado === 'terminado';
  const vencida = !terminada && estaVencida(tarea.fechaLimite);
  // Para cerrar la tarea: checklist completo y al menos una foto de evidencia
  const motivo = motivoNoCierre(items, fotos);
  // Editor: todo. Programador: avanza y completa solo sus tareas. El resto solo consulta.
  const puedeTrabajar = puedeTrabajarTarea(actual, tarea);
  const editable = puedeTrabajar && !terminada;

  const ejecutar = async (accion: () => Promise<void>) => {
    setAviso('');
    setOcupado(true);
    try {
      await accion();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No se pudo guardar el cambio');
    } finally {
      setOcupado(false);
    }
  };

  const mover = (estado: Estado) => ejecutar(() => moverTarea(tarea.id, estado));
  const alternar = (itemId: string) => ejecutar(() => alternarItem(itemId));
  const eliminar = () =>
    ejecutar(async () => {
      await eliminarTarea(tarea.id);
      volver();
    });

  const opciones: Accion[] = [
    {
      etiqueta: 'Editar tarea',
      icono: 'editar',
      onPress: () => router.push({ pathname: '/tablero/nueva', params: { id: tarea.id } }),
    },
    ...COLUMNAS.filter((c) => c.estado !== tarea.estado && c.estado !== 'terminado').map<Accion>((c) => ({
      etiqueta: terminada ? `Reabrir en ${c.nombre}` : `Mover a ${c.nombre}`,
      icono: terminada ? 'reabrir' : 'intercambio',
      onPress: () => mover(c.estado),
    })),
    { etiqueta: 'Eliminar tarea', icono: 'basura', peligro: true, onPress: () => setMenu('eliminar') },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <BarraSuperior onVolver={volver} onOpciones={esEditor ? () => setMenu('opciones') : undefined} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
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
            {tarea.descripcion ? <Text style={styles.descripcion}>{tarea.descripcion}</Text> : null}
          </View>

          <View style={styles.meta}>
            {responsable && (
              <View style={styles.metaFila}>
                <Avatar nombre={responsable.nombre} tamano={24} />
                <Text style={styles.metaTexto}>Asignado a {responsable.nombre}</Text>
              </View>
            )}
            <View style={styles.metaFila}>
              <Icono nombre="reloj" tamano={16} color={vencida ? Colores.peligro : Colores.primario} />
              <Text style={[styles.metaTexto, { color: vencida ? Colores.peligro : Colores.primario }]}>
                Fecha límite · {formatearFecha(tarea.fechaLimite)}
                {vencida ? ' · Vencida' : ''}
              </Text>
            </View>
          </View>

          {!puedeTrabajar && (
            <View style={styles.soloLectura}>
              <Icono nombre="ojo" tamano={16} color={Colores.primario} />
              <Text style={styles.soloLecturaTexto}>
                {actual?.rol === 'programador'
                  ? 'Esta tarea está asignada a otra persona: solo puedes consultarla.'
                  : 'Modo Visualizador: solo puedes consultar esta tarea.'}
              </Text>
            </View>
          )}

          <Checklist items={items} onToggle={editable && !ocupado ? alternar : undefined} />

          <Evidencias
            fotos={fotos}
            puedeAgregar={editable}
            onEliminar={editable && !ocupado ? (fotoId) => ejecutar(() => eliminarEvidencia(fotoId)) : undefined}
            onAgregar={() => router.push({ pathname: '/camera', params: { tareaId: tarea.id } })}
          />

          <Comentarios tareaId={tarea.id} enfocar={comentar === '1'} />
        </ScrollView>

        {puedeTrabajar && (
          <View style={styles.pie}>
            {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
            {!terminada && motivo && !aviso ? <Text style={styles.ayuda}>{motivo} para completarla.</Text> : null}
            <View style={styles.acciones}>
              {terminada ? (
                <Boton
                  titulo="Reabrir tarea"
                  icono="reabrir"
                  variante="secundario"
                  deshabilitado={ocupado}
                  estilo={styles.flex}
                  onPress={() => mover('en_progreso')}
                />
              ) : (
                <>
                  <Boton
                    titulo={tarea.estado === 'pendiente' ? 'Empezar' : 'A pendiente'}
                    icono={tarea.estado === 'pendiente' ? 'play' : 'reabrir'}
                    variante="secundario"
                    deshabilitado={ocupado}
                    estilo={styles.flex}
                    onPress={() => mover(tarea.estado === 'pendiente' ? 'en_progreso' : 'pendiente')}
                  />
                  <Boton
                    titulo="Completar tarea"
                    deshabilitado={!!motivo || ocupado}
                    estilo={styles.flex}
                    onPress={() => mover('terminado')}
                  />
                </>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <HojaAcciones
        visible={menu === 'opciones'}
        titulo={tarea.titulo}
        acciones={opciones}
        onCerrar={() => setMenu(null)}
      />
      <HojaAcciones
        visible={menu === 'eliminar'}
        titulo="¿Eliminar esta tarea?"
        mensaje="Se borrarán también su checklist y sus fotos de evidencia. No se puede deshacer."
        acciones={[{ etiqueta: 'Sí, eliminar', icono: 'basura', peligro: true, onPress: eliminar }]}
        onCerrar={() => setMenu(null)}
      />
    </SafeAreaView>
  );
}

function BarraSuperior({ onVolver, onOpciones }: { onVolver: () => void; onOpciones?: () => void }) {
  return (
    <View style={styles.barra}>
      <Pressable onPress={onVolver} hitSlop={8}>
        <Icono nombre="atras" />
      </Pressable>
      <Text style={styles.barraTitulo}>Detalle de tarea</Text>
      {onOpciones ? (
        <Pressable onPress={onOpciones} hitSlop={8}>
          <Icono nombre="opciones" color={Colores.textoSecundario} />
        </Pressable>
      ) : (
        <View style={styles.hueco} />
      )}
    </View>
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
  hueco: {
    width: 20,
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
  soloLectura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
    padding: Espacio.md,
    borderRadius: Radio.md,
    backgroundColor: Colores.primarioSuave,
  },
  soloLecturaTexto: {
    flex: 1,
    fontSize: 13,
    color: Colores.primario,
  },
  pie: {
    gap: Espacio.sm,
    padding: Espacio.lg,
    borderTopWidth: 1,
    borderTopColor: Colores.borde,
    backgroundColor: Colores.fondo,
  },
  aviso: {
    fontSize: 13,
    color: Colores.peligro,
  },
  ayuda: {
    fontSize: 12,
    color: Colores.textoSecundario,
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
  },
});
