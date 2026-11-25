import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';

export type Accion = {
  etiqueta: string;
  icono?: NombreIcono;
  peligro?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  titulo: string;
  mensaje?: string;
  acciones: Accion[];
  onCerrar: () => void;
};

// Hoja inferior con una lista de acciones (menú ⋯, mover tarea, confirmar borrado).
// Se usa en lugar de Alert con botones porque Alert no funciona en web.
export function HojaAcciones({ visible, titulo, mensaje, acciones, onCerrar }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        {/* Evitar que tocar dentro de la hoja la cierre */}
        <Pressable style={styles.hoja} onPress={() => {}}>
          <View style={styles.barra}>
            <Text style={styles.titulo} numberOfLines={2}>
              {titulo}
            </Text>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Icono nombre="cerrar" />
            </Pressable>
          </View>
          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

          <View style={styles.lista}>
            {acciones.map((a) => {
              const color = a.peligro ? Colores.peligro : Colores.texto;
              return (
                <Pressable
                  key={a.etiqueta}
                  onPress={() => {
                    onCerrar();
                    a.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.opcion,
                    a.peligro && styles.opcionPeligro,
                    pressed && styles.presionada,
                  ]}>
                  {a.icono && <Icono nombre={a.icono} tamano={18} color={color} />}
                  <Text style={[styles.opcionTexto, { color }]}>{a.etiqueta}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
  },
  hoja: {
    gap: Espacio.lg,
    padding: Espacio.xl,
    paddingBottom: Espacio.xxl,
    borderTopLeftRadius: Radio.xl,
    borderTopRightRadius: Radio.xl,
    backgroundColor: Colores.fondo,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Espacio.md,
  },
  titulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colores.texto,
  },
  mensaje: {
    fontSize: 13,
    lineHeight: 18,
    color: Colores.textoSecundario,
    marginTop: -Espacio.sm,
  },
  lista: {
    gap: Espacio.sm,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    minHeight: 48,
    paddingHorizontal: Espacio.lg,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  opcionPeligro: {
    borderColor: '#F8C9C9',
    backgroundColor: Colores.peligroSuave,
  },
  opcionTexto: {
    fontSize: 15,
    fontWeight: '600',
  },
  presionada: {
    opacity: 0.8,
  },
});
