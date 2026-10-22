import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge, BadgeEnVivo } from '@/components/ui/Badge';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { ROLES } from '@/constants/estados';
import type { Usuario } from '@/types/modelos';

type Props = {
  usuario: Usuario;
  tareas: number;
};

export function MiembroItem({ usuario, tareas }: Props) {
  const rol = ROLES[usuario.rol];

  return (
    <View style={styles.fila}>
      <Avatar nombre={usuario.nombre} tamano={40} />
      <View style={styles.info}>
        <Text style={styles.nombre}>{usuario.nombre}</Text>
        <View style={styles.badges}>
          <Badge texto={rol.etiqueta} color={rol.color} fondo={rol.fondo} />
          {usuario.enVivo ? (
            <BadgeEnVivo texto="Sinc. en vivo" />
          ) : (
            <Badge texto="Desconectado" color={Colores.textoSecundario} fondo={Colores.fondo} punto />
          )}
        </View>
      </View>
      <View style={styles.tareas}>
        <Text style={styles.numero}>{tareas}</Text>
        <Text style={styles.textoTenue}>tareas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    padding: Espacio.md,
    backgroundColor: Colores.superficie,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  info: {
    flex: 1,
    gap: Espacio.xs,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '700',
    color: Colores.texto,
  },
  badges: {
    flexDirection: 'row',
    gap: Espacio.xs,
    flexWrap: 'wrap',
  },
  tareas: {
    alignItems: 'flex-end',
  },
  numero: {
    fontSize: 16,
    fontWeight: '600',
    color: Colores.texto,
  },
  textoTenue: {
    fontSize: 11,
    color: Colores.textoSecundario,
  },
});
