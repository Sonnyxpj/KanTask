import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Colores, Espacio, Radio } from '@/constants/colores';
import type { Tarea, Usuario } from '@/types/modelos';

type Props = {
  equipo: string;
  lider?: Usuario;
  integrantes: Usuario[];
  tareas: Tarea[];
  sinConexion: boolean;
};

const MAX_AVATARES = 4;

// Tarjeta oscura del tablero (mockup "Sprint activo"): equipo, líder, integrantes y avance
export function ResumenTablero({ equipo, lider, integrantes, tareas, sinConexion }: Props) {
  const terminadas = tareas.filter((t) => t.estado === 'terminado').length;
  const avance = tareas.length ? terminadas / tareas.length : 0;
  const extra = integrantes.length - MAX_AVATARES;

  return (
    <View style={styles.tarjeta}>
      <View style={styles.fila}>
        <Text style={styles.etiqueta}>TABLERO ACTIVO</Text>
        <View style={[styles.estado, sinConexion && styles.estadoOffline]}>
          <View style={[styles.punto, sinConexion && { backgroundColor: Colores.alerta }]} />
          <Text style={[styles.estadoTexto, sinConexion && { color: Colores.alerta }]}>
            {sinConexion ? 'Sin conexión' : 'En curso'}
          </Text>
        </View>
      </View>

      <Text style={styles.titulo}>{equipo}</Text>

      <View style={styles.fila}>
        <Text style={styles.lider} numberOfLines={1}>
          {lider ? `Líder del equipo · ${lider.nombre}` : `${integrantes.length} integrantes`}
        </Text>
        <View style={styles.avatares}>
          {integrantes.slice(0, MAX_AVATARES).map((u, i) => (
            <View key={u.id} style={[styles.avatar, i > 0 && styles.solapado]}>
              <Avatar nombre={u.nombre} tamano={26} />
            </View>
          ))}
          {extra > 0 && (
            <View style={[styles.avatar, styles.solapado, styles.mas]}>
              <Text style={styles.masTexto}>+{extra}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.progreso}>
        <View style={styles.barra}>
          <View style={[styles.relleno, { width: `${avance * 100}%` }]} />
        </View>
        <Text style={styles.progresoTexto}>
          {terminadas} de {tareas.length} terminadas
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    marginHorizontal: Espacio.lg,
    padding: Espacio.lg,
    gap: Espacio.sm,
    borderRadius: Radio.lg,
    backgroundColor: Colores.marino,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Espacio.md,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9FB3C8',
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.xs,
    paddingHorizontal: Espacio.sm,
    paddingVertical: 2,
    borderRadius: Radio.pill,
    backgroundColor: Colores.exitoSuave,
  },
  estadoOffline: {
    backgroundColor: Colores.alertaSuave,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colores.exito,
  },
  estadoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: Colores.exito,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lider: {
    flex: 1,
    fontSize: 12,
    color: '#C9D4DF',
  },
  avatares: {
    flexDirection: 'row',
  },
  avatar: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colores.marino,
  },
  solapado: {
    marginLeft: -8,
  },
  mas: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colores.marinoClaro,
  },
  masTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progreso: {
    gap: Espacio.xs,
    marginTop: Espacio.xs,
  },
  barra: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    backgroundColor: Colores.exito,
  },
  progresoTexto: {
    fontSize: 11,
    color: '#C9D4DF',
  },
});
