import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { BadgeEnVivo, Chip } from '@/components/ui/Badge';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { useActividad } from '@/lib/actividad';
import { useEquipo } from '@/lib/equipo';
import { formatearHace } from '@/lib/fechas';
import { textoActividad } from '@/lib/reglas';
import { useSesion } from '@/lib/sesion';
import { useTablero } from '@/lib/tablero';
import type { Actividad as ItemActividad, TipoActividad } from '@/types/modelos';

const FILTROS = ['Todas', 'Menciones', 'Tareas', 'Evidencias'] as const;
type Filtro = (typeof FILTROS)[number];

const TIPOS: Record<
  TipoActividad,
  { icono: NombreIcono; color: string; fondo: string; filtro: Filtro; accion: string }
> = {
  creada: {
    icono: 'mas',
    color: Colores.primario,
    fondo: Colores.primarioSuave,
    filtro: 'Tareas',
    accion: 'Ver tarea',
  },
  asignacion: {
    icono: 'documento',
    color: Colores.primario,
    fondo: Colores.primarioSuave,
    filtro: 'Tareas',
    accion: 'Ver tarea',
  },
  cambio: {
    icono: 'intercambio',
    color: Colores.exito,
    fondo: Colores.exitoSuave,
    filtro: 'Tareas',
    accion: 'Ver tarea',
  },
  evidencia: {
    icono: 'camara',
    color: Colores.morado,
    fondo: Colores.moradoSuave,
    filtro: 'Evidencias',
    accion: 'Abrir prueba',
  },
  completada: {
    icono: 'checkCirculo',
    color: Colores.exito,
    fondo: Colores.exitoSuave,
    filtro: 'Tareas',
    accion: 'Ver detalles',
  },
  mencion: {
    icono: 'mensaje',
    color: Colores.alerta,
    fondo: Colores.alertaSuave,
    filtro: 'Menciones',
    accion: 'Responder',
  },
};

// Pantalla 4 · Actividad
export default function Actividad() {
  const [filtro, setFiltro] = useState<Filtro>('Todas');
  // Icono de filtros del encabezado: mostrar solo lo que me afecta
  const [soloParaMi, setSoloParaMi] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [, setReloj] = useState(0);

  const { sesion, modoDemo } = useSesion();
  const { buscarUsuario } = useEquipo();
  const { tareas } = useTablero();
  const { lista, cargando, error, sinConexion, marcarVistas, recargar } = useActividad();
  const idActual = sesion?.user.id;

  // Al entrar y al salir de la pestaña todo queda como leído
  useFocusEffect(
    useCallback(() => {
      marcarVistas();
      return marcarVistas;
    }, [marcarVistas]),
  );

  // Refrescar los "Hace X min" cada minuto
  useEffect(() => {
    const intervalo = setInterval(() => setReloj((n) => n + 1), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  const refrescar = async () => {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  };

  const paraMi = (a: ItemActividad) => modoDemo || a.destinatarioId === idActual;
  const visibles = lista.filter((a) => {
    if (soloParaMi && !paraMi(a)) return false;
    if (filtro === 'Todas') return true;
    // Menciones: solo las que me mencionan a mí
    if (filtro === 'Menciones') return a.tipo === 'mencion' && paraMi(a);
    return TIPOS[a.tipo].filtro === filtro;
  });

  const abrir = (a: ItemActividad) => {
    if (!a.tareaId) return;
    router.push({
      pathname: '/tablero/[id]',
      params: a.tipo === 'mencion' ? { id: a.tareaId, comentar: '1' } : { id: a.tareaId },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <Encabezado
        titulo="Actividad"
        subtitulo={soloParaMi ? 'Solo lo que te afecta a ti' : 'Actualizaciones en vivo del equipo'}
        accion={
          <Pressable
            onPress={() => setSoloParaMi((v) => !v)}
            hitSlop={8}
            style={[styles.botonFiltro, soloParaMi && styles.botonFiltroActivo]}>
            <Icono nombre="filtros" tamano={18} color={soloParaMi ? '#FFFFFF' : Colores.textoSecundario} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {FILTROS.map((f) => (
            <Chip key={f} texto={f} activo={filtro === f} onPress={() => setFiltro(f)} />
          ))}
        </ScrollView>

        {sinConexion ? (
          <View style={[styles.aviso, styles.avisoOffline]}>
            <View style={[styles.avisoPunto, { backgroundColor: Colores.alerta }]} />
            <Text style={[styles.avisoTexto, { color: Colores.alerta }]}>
              Sin conexión · mostrando la actividad guardada
            </Text>
          </View>
        ) : (
          <View style={styles.aviso}>
            <View style={styles.avisoPunto} />
            <Text style={styles.avisoTexto}>La actividad en tiempo real se está sincronizando</Text>
            <BadgeEnVivo />
          </View>
        )}

        <View style={styles.lista}>
          {cargando ? (
            <ActivityIndicator color={Colores.primario} style={styles.cargando} />
          ) : error ? (
            <Pressable onPress={refrescar}>
              <Text style={[styles.vacio, { color: Colores.peligro }]}>{error} · Toca para reintentar</Text>
            </Pressable>
          ) : visibles.length === 0 ? (
            <Text style={styles.vacio}>
              {lista.length === 0 ? 'Todavía no hay actividad en el tablero' : 'No hay actividad para este filtro'}
            </Text>
          ) : (
            visibles.map((a) => {
              const tipo = TIPOS[a.tipo];
              const usuario = buscarUsuario(a.usuarioId);
              const existe = !!a.tareaId && tareas.some((t) => t.id === a.tareaId);
              return (
                <View key={a.id} style={styles.item}>
                  <View style={[styles.icono, { backgroundColor: tipo.fondo }]}>
                    <Icono nombre={tipo.icono} tamano={18} color={tipo.color} />
                  </View>
                  <View style={styles.cuerpo}>
                    <Text style={styles.texto}>{textoActividad(a, idActual, buscarUsuario)}</Text>
                    <View style={styles.pie}>
                      {usuario && <Avatar nombre={usuario.nombre} tamano={20} />}
                      <Text style={styles.hace}>{formatearHace(a.fecha)}</Text>
                      {existe && (
                        <Pressable style={styles.accion} onPress={() => abrir(a)} hitSlop={6}>
                          <Text style={styles.accionTexto}>{tipo.accion}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  contenido: {
    paddingBottom: Espacio.xl,
    gap: Espacio.lg,
  },
  filtros: {
    paddingHorizontal: Espacio.lg,
    gap: Espacio.sm,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
    marginHorizontal: Espacio.lg,
    padding: Espacio.md,
    borderRadius: Radio.md,
    backgroundColor: Colores.exitoSuave,
  },
  avisoOffline: {
    backgroundColor: Colores.alertaSuave,
  },
  botonFiltro: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonFiltroActivo: {
    backgroundColor: Colores.marino,
    borderColor: Colores.marino,
  },
  cargando: {
    paddingVertical: Espacio.xl,
  },
  avisoPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colores.exito,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  lista: {
    paddingHorizontal: Espacio.lg,
    gap: Espacio.md,
  },
  item: {
    flexDirection: 'row',
    gap: Espacio.md,
    padding: Espacio.md,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  icono: {
    width: 38,
    height: 38,
    borderRadius: Radio.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: {
    flex: 1,
    gap: Espacio.sm,
  },
  texto: {
    fontSize: 14,
    fontWeight: '500',
    color: Colores.texto,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
  },
  hace: {
    flex: 1,
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  accion: {
    paddingVertical: 2,
  },
  accionTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: Colores.primario,
  },
  vacio: {
    textAlign: 'center',
    fontSize: 13,
    color: Colores.textoTenue,
    paddingVertical: Espacio.xl,
  },
});
