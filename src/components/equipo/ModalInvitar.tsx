import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { ROLES } from '@/constants/estados';
import { invitarMiembro, type NuevaInvitacion } from '@/services/invitaciones';
import type { Invitacion, Rol } from '@/types/modelos';

type Props = {
  visible: boolean;
  onCerrar: () => void;
  onInvitado: (invitacion: Invitacion) => void;
};

type Errores = Partial<Record<'nombre' | 'correo' | 'general', string>>;

const VACIO: NuevaInvitacion = { nombre: '', correo: '', rol: 'editor', cargo: '' };
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Formulario "Agregar integrante" (Pantalla 5)
export function ModalInvitar({ visible, onCerrar, onInvitado }: Props) {
  const [valores, setValores] = useState<NuevaInvitacion>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  const cambiar = <K extends keyof NuevaInvitacion>(campo: K, valor: NuevaInvitacion[K]) =>
    setValores((v) => ({ ...v, [campo]: valor }));

  const cerrar = () => {
    setValores(VACIO);
    setErrores({});
    onCerrar();
  };

  const guardar = async () => {
    const nuevos: Errores = {};
    if (!valores.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio';
    if (!CORREO_VALIDO.test(valores.correo.trim())) nuevos.correo = 'Ingresa un correo válido';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      onInvitado(await invitarMiembro(valores));
      cerrar();
    } catch (e) {
      setErrores({ general: e instanceof Error ? e.message : 'No se pudo enviar la invitación' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={cerrar}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.pantalla}>
        <View style={styles.barra}>
          <Pressable onPress={cerrar} hitSlop={8}>
            <Icono nombre="cerrar" />
          </Pressable>
          <Text style={styles.titulo}>Agregar integrante</Text>
          <View style={styles.hueco} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            <Campo
              etiqueta="Nombre *"
              placeholder="Ej: Camila Rojas"
              value={valores.nombre}
              onChangeText={(t) => cambiar('nombre', t)}
              error={errores.nombre}
            />

            <Campo
              etiqueta="Correo *"
              placeholder="nombre@correo.com"
              icono="correo"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={valores.correo}
              onChangeText={(t) => cambiar('correo', t)}
              error={errores.correo}
            />

            <Campo
              etiqueta="Cargo"
              placeholder="Ej: Frontend, QA, Product owner"
              value={valores.cargo}
              onChangeText={(t) => cambiar('cargo', t)}
            />

            <View style={styles.grupo}>
              <Text style={styles.etiqueta}>Rol</Text>
              <View style={styles.opciones}>
                {(Object.keys(ROLES) as Rol[]).map((r) => {
                  const info = ROLES[r];
                  const activo = valores.rol === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => cambiar('rol', r)}
                      style={[styles.opcion, activo && { backgroundColor: info.fondo, borderColor: info.color }]}>
                      <Text style={[styles.opcionTexto, activo && { color: info.color }]}>{info.etiqueta}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.ayuda}>
                {valores.rol === 'editor'
                  ? 'Puede crear, editar y mover tareas.'
                  : 'Solo puede ver el tablero, sin modificarlo.'}
              </Text>
            </View>

            <Text style={styles.ayuda}>
              Al registrarse en KanTask con este correo, se unirá al equipo con el rol elegido.
            </Text>

            {errores.general && <Text style={styles.error}>{errores.general}</Text>}

            <Boton
              titulo={enviando ? 'Enviando…' : 'Enviar invitación'}
              icono="agregarPersona"
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
    gap: Espacio.sm,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.texto,
  },
  opciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.sm,
  },
  opcion: {
    paddingHorizontal: Espacio.lg,
    paddingVertical: Espacio.sm,
    borderRadius: Radio.pill,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  opcionTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.textoSecundario,
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
