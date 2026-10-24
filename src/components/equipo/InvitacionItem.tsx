import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { ROLES } from '@/constants/estados';
import type { Invitacion } from '@/types/modelos';

type Props = {
  invitacion: Invitacion;
  onCancelar?: () => void;
};

// Fila de invitación pendiente (aún no se registra)
export function InvitacionItem({ invitacion, onCancelar }: Props) {
  const rol = ROLES[invitacion.rol];

  return (
    <View style={styles.fila}>
      <Avatar nombre={invitacion.nombre} tamano={40} />
      <View style={styles.info}>
        <Text style={styles.nombre}>{invitacion.nombre}</Text>
        <Text style={styles.correo}>{invitacion.correo}</Text>
        <View style={styles.badges}>
          <Badge texto={rol.etiqueta} color={rol.color} fondo={rol.fondo} />
          <Badge texto="Invitación pendiente" color={Colores.alerta} fondo={Colores.alertaSuave} punto />
        </View>
      </View>
      {onCancelar && (
        <Pressable onPress={onCancelar} hitSlop={8}>
          <Icono nombre="cerrar" tamano={16} color={Colores.textoSecundario} />
        </Pressable>
      )}
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
    borderStyle: 'dashed',
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
  correo: {
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  badges: {
    flexDirection: 'row',
    gap: Espacio.xs,
    flexWrap: 'wrap',
  },
});
