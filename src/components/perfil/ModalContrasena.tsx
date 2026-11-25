import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio } from '@/constants/colores';
import { useSesion } from '@/lib/sesion';

type Props = {
  visible: boolean;
  onCerrar: () => void;
  onCambiada: () => void;
};

type Valores = { actual: string; nueva: string; confirmar: string };
type Errores = Partial<Record<keyof Valores | 'general', string>>;

const VACIO: Valores = { actual: '', nueva: '', confirmar: '' };

// Perfil → "Seguridad y acceso": cambiar la contraseña con la sesión iniciada
export function ModalContrasena({ visible, onCerrar, onCambiada }: Props) {
  const { cambiarContrasena } = useSesion();
  const [valores, setValores] = useState<Valores>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  // Al abrir, el formulario parte vacío (ajuste durante el render)
  const [visiblePrevio, setVisiblePrevio] = useState(visible);
  if (visible !== visiblePrevio) {
    setVisiblePrevio(visible);
    if (visible) {
      setValores(VACIO);
      setErrores({});
    }
  }

  const cambiar = (campo: keyof Valores, valor: string) => setValores((v) => ({ ...v, [campo]: valor }));

  const guardar = async () => {
    const nuevos: Errores = {};
    if (!valores.actual) nuevos.actual = 'Ingresa tu contraseña actual';
    if (valores.nueva.length < 6) nuevos.nueva = 'La contraseña debe tener al menos 6 caracteres';
    else if (valores.nueva === valores.actual) nuevos.nueva = 'La nueva contraseña debe ser distinta a la actual';
    if (valores.confirmar !== valores.nueva) nuevos.confirmar = 'Las contraseñas no coinciden';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    const resultado = await cambiarContrasena(valores.actual, valores.nueva);
    setEnviando(false);
    if (resultado.error) {
      setErrores({ general: resultado.error });
      return;
    }
    onCambiada();
    onCerrar();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCerrar}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.pantalla}>
        <View style={styles.barra}>
          <Pressable onPress={onCerrar} hitSlop={8}>
            <Icono nombre="cerrar" />
          </Pressable>
          <Text style={styles.titulo}>Seguridad y acceso</Text>
          <View style={styles.hueco} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            <Text style={styles.ayuda}>Cambia la contraseña con la que ingresas a KanTask.</Text>

            <Campo
              etiqueta="Contraseña actual *"
              icono="candado"
              contrasena
              autoComplete="current-password"
              value={valores.actual}
              onChangeText={(t) => cambiar('actual', t)}
              error={errores.actual}
            />
            <Campo
              etiqueta="Nueva contraseña *"
              icono="candado"
              contrasena
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={valores.nueva}
              onChangeText={(t) => cambiar('nueva', t)}
              error={errores.nueva}
            />
            <Campo
              etiqueta="Repetir nueva contraseña *"
              icono="candado"
              contrasena
              autoComplete="new-password"
              value={valores.confirmar}
              onChangeText={(t) => cambiar('confirmar', t)}
              error={errores.confirmar}
            />

            {errores.general && <Text style={styles.error}>{errores.general}</Text>}

            <Boton
              titulo={enviando ? 'Guardando…' : 'Cambiar contraseña'}
              icono="check"
              onPress={guardar}
              deshabilitado={enviando}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colores.texto,
  },
  hueco: {
    width: 20,
  },
  contenido: {
    padding: Espacio.lg,
    paddingBottom: Espacio.xxl,
    gap: Espacio.lg,
  },
  ayuda: {
    fontSize: 13,
    color: Colores.textoSecundario,
  },
  error: {
    fontSize: 13,
    color: Colores.peligro,
  },
});
