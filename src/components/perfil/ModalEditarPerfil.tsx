import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio } from '@/constants/colores';
import { actualizarPerfil, cambiarCorreo } from '@/services/usuarios';
import type { Usuario } from '@/types/modelos';

type Props = {
  visible: boolean;
  usuario: Usuario;
  onCerrar: () => void;
  onGuardado: (usuario: Usuario, correoPendiente?: string) => void;
};

type Valores = { nombre: string; correo: string; telefono: string };
type Errores = Partial<Record<keyof Valores | 'general', string>>;

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Formulario "Editar perfil" (Pantalla 6 · lápiz del encabezado)
export function ModalEditarPerfil({ visible, usuario, onCerrar, onGuardado }: Props) {
  const inicial = (): Valores => ({ nombre: usuario.nombre, correo: usuario.correo, telefono: usuario.telefono ?? '' });
  const [valores, setValores] = useState<Valores>(inicial);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  // Partir siempre desde los datos actuales al abrir
  useEffect(() => {
    if (visible) {
      setValores(inicial());
      setErrores({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const cambiar = (campo: keyof Valores, valor: string) => setValores((v) => ({ ...v, [campo]: valor }));

  const guardar = async () => {
    const nuevos: Errores = {};
    if (!valores.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio';
    else if (valores.nombre.trim().length > 80) nuevos.nombre = 'Máximo 80 caracteres';
    if (!CORREO_VALIDO.test(valores.correo.trim())) nuevos.correo = 'Ingresa un correo válido';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const correoNuevo = valores.correo.trim().toLowerCase();
    const cambiaCorreo = correoNuevo !== usuario.correo.toLowerCase();

    setEnviando(true);
    try {
      await actualizarPerfil(usuario.id, { nombre: valores.nombre, telefono: valores.telefono });
      if (cambiaCorreo) await cambiarCorreo(correoNuevo);
      onGuardado(
        { ...usuario, nombre: valores.nombre.trim(), telefono: valores.telefono.trim() || undefined },
        cambiaCorreo ? correoNuevo : undefined,
      );
      onCerrar();
    } catch (e) {
      setErrores({ general: e instanceof Error ? e.message : 'No se pudo guardar tu perfil' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCerrar}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.pantalla}>
        <View style={styles.barra}>
          <Pressable onPress={onCerrar} hitSlop={8}>
            <Icono nombre="cerrar" />
          </Pressable>
          <Text style={styles.titulo}>Editar perfil</Text>
          <View style={styles.hueco} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            <Campo
              etiqueta="Nombre *"
              icono="perfil"
              placeholder="Tu nombre"
              value={valores.nombre}
              onChangeText={(t) => cambiar('nombre', t)}
              error={errores.nombre}
            />

            <View style={styles.grupo}>
              <Campo
                etiqueta="Correo electrónico *"
                icono="correo"
                placeholder="nombre@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={valores.correo}
                onChangeText={(t) => cambiar('correo', t)}
                error={errores.correo}
              />
              <Text style={styles.ayuda}>
                Si lo cambias, te enviaremos un enlace de confirmación. El correo se actualiza al confirmarlo.
              </Text>
            </View>

            <Campo
              etiqueta="Teléfono"
              icono="telefono"
              placeholder="+56 9 1234 5678"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={valores.telefono}
              onChangeText={(t) => cambiar('telefono', t)}
            />

            {errores.general && <Text style={styles.error}>{errores.general}</Text>}

            <Boton
              titulo={enviando ? 'Guardando…' : 'Guardar cambios'}
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
  grupo: {
    gap: Espacio.xs + 2,
  },
  ayuda: {
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  error: {
    fontSize: 13,
    color: Colores.peligro,
  },
});
