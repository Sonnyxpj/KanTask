import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { BadgeEnVivo, Chip } from '@/components/ui/Badge';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { ACTIVIDAD, buscarUsuario, type TipoActividad } from '@/constants/datos-demo';

const FILTROS = ['Todas', 'Menciones', 'Tareas', 'Evidencias'] as const;
type Filtro = (typeof FILTROS)[number];

const TIPOS: Record<TipoActividad, { icono: NombreIcono; color: string; fondo: string; filtro: Filtro }> = {
  asignacion: { icono: 'documento', color: Colores.primario, fondo: Colores.primarioSuave, filtro: 'Tareas' },
  cambio: { icono: 'intercambio', color: Colores.exito, fondo: Colores.exitoSuave, filtro: 'Tareas' },
  evidencia: { icono: 'camara', color: Colores.morado, fondo: Colores.moradoSuave, filtro: 'Evidencias' },
  completada: { icono: 'checkCirculo', color: Colores.exito, fondo: Colores.exitoSuave, filtro: 'Tareas' },
  mencion: { icono: 'mensaje', color: Colores.alerta, fondo: Colores.alertaSuave, filtro: 'Menciones' },
};

// Pantalla 4 · Actividad en vivo
export default function Actividad() {
  const [filtro, setFiltro] = useState<Filtro>('Todas');
  const lista = ACTIVIDAD.filter((a) => filtro === 'Todas' || TIPOS[a.tipo].filtro === filtro);

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <Encabezado
        titulo="Actividad"
        subtitulo="Actualizaciones en vivo del equipo"
        accion={<Icono nombre="filtros" color={Colores.textoSecundario} />}
      />

      <ScrollView contentContainerStyle={styles.contenido}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {FILTROS.map((f) => (
            <Chip key={f} texto={f} activo={filtro === f} onPress={() => setFiltro(f)} />
          ))}
        </ScrollView>

        <View style={styles.aviso}>
          <View style={styles.avisoPunto} />
          <Text style={styles.avisoTexto}>La actividad en tiempo real se está sincronizando</Text>
          <BadgeEnVivo />
        </View>

        <View style={styles.lista}>
          {lista.map((a) => {
            const tipo = TIPOS[a.tipo];
            const usuario = buscarUsuario(a.usuarioId);
            return (
              <View key={a.id} style={styles.item}>
                <View style={[styles.icono, { backgroundColor: tipo.fondo }]}>
                  <Icono nombre={tipo.icono} tamano={18} color={tipo.color} />
                </View>
                <View style={styles.cuerpo}>
                  <Text style={styles.texto}>{a.texto}</Text>
                  <View style={styles.pie}>
                    {usuario && <Avatar nombre={usuario.nombre} tamano={20} />}
                    <Text style={styles.hace}>{a.hace}</Text>
                    <Pressable
                      style={styles.accion}
                      onPress={() =>
                        a.tareaId && router.push({ pathname: '/tablero/[id]', params: { id: a.tareaId } })
                      }>
                      <Text style={styles.accionTexto}>{a.accion}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
          {lista.length === 0 && <Text style={styles.vacio}>No hay actividad para este filtro</Text>}
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
