import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Boton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { ROLES } from '@/constants/estados';
import { cambiarRol } from '@/services/usuarios';
import type { Rol, Usuario } from '@/types/modelos';

type Props = {
  usuario: Usuario | null;
  onCerrar: () => void;
  onCambiado: () => void;
};

const DESCRIPCION: Record<Rol, string> = {
  editor: 'Puede crear, editar y mover tareas, y cambiar roles.',
  visualizador: 'Solo puede ver el tablero, sin modificarlo.',
};

// Hoja "Cambiar rol" (Pantalla 5 · tocar un integrante, solo editores)
export function ModalRol({ usuario, onCerrar, onCambiado }: Props) {
  const [rol, setRol] = useState<Rol>('visualizador');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setRol(usuario.rol);
      setError('');
    }
  }, [usuario]);

  const guardar = async () => {
    if (!usuario) return;
    if (rol === usuario.rol) {
      onCerrar();
      return;
    }
    setEnviando(true);
    try {
      await cambiarRol(usuario.id, rol);
      onCambiado();
      onCerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el rol');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal visible={!!usuario} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        {/* Evitar que tocar dentro de la hoja la cierre */}
        <Pressable style={styles.hoja} onPress={() => {}}>
          <View style={styles.barra}>
            <Text style={styles.titulo}>Cambiar rol</Text>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Icono nombre="cerrar" />
            </Pressable>
          </View>

          {usuario && (
            <View style={styles.persona}>
              <Avatar nombre={usuario.nombre} tamano={36} />
              <View>
                <Text style={styles.nombre}>{usuario.nombre}</Text>
                <Text style={styles.correo}>{usuario.correo}</Text>
              </View>
            </View>
          )}

          <View style={styles.opciones}>
            {(Object.keys(ROLES) as Rol[]).map((r) => {
              const info = ROLES[r];
              const activo = rol === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRol(r)}
                  style={[styles.opcion, activo && { backgroundColor: info.fondo, borderColor: info.color }]}>
                  <View style={styles.flex}>
                    <Text style={[styles.opcionTitulo, activo && { color: info.color }]}>{info.etiqueta}</Text>
                    <Text style={styles.opcionTexto}>{DESCRIPCION[r]}</Text>
                  </View>
                  {activo && <Icono nombre="checkCirculo" tamano={20} color={info.color} />}
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Boton
            titulo={enviando ? 'Guardando…' : 'Guardar rol'}
            onPress={guardar}
            deshabilitado={enviando || !usuario}
          />
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
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colores.texto,
  },
  persona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
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
  opciones: {
    gap: Espacio.sm,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    padding: Espacio.md,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  opcionTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: Colores.texto,
  },
  opcionTexto: {
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  error: {
    fontSize: 13,
    color: Colores.peligro,
  },
});
