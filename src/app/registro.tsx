import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { useSesion } from '@/lib/sesion';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errores = { nombre?: string; correo?: string; contrasena?: string; confirmar?: string; general?: string };

// Pantalla de registro · crea la cuenta en Supabase Auth
export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [confirmacionPendiente, setConfirmacionPendiente] = useState(false);
  const { registrarse } = useSesion();

  const validar = (): Errores => {
    const e: Errores = {};
    if (!nombre.trim()) e.nombre = 'Ingresa tu nombre';
    else if (nombre.trim().length > 80) e.nombre = 'Máximo 80 caracteres';
    if (!CORREO_VALIDO.test(correo.trim())) e.correo = 'Ingresa un correo válido';
    if (contrasena.length < 6) e.contrasena = 'Mínimo 6 caracteres';
    if (confirmar !== contrasena) e.confirmar = 'Las contraseñas no coinciden';
    return e;
  };

  const crearCuenta = async () => {
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    const resultado = await registrarse(nombre, correo, contrasena);
    setEnviando(false);

    if (resultado.error) setErrores({ general: resultado.error });
    else if (resultado.requiereConfirmacion) setConfirmacionPendiente(true);
    // Si Supabase entrega sesión al instante, el Stack.Protected redirige al tablero
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.volver} onPress={() => router.back()} hitSlop={8}>
            <Icono nombre="atras" tamano={20} color={Colores.texto} />
            <Text style={styles.volverTexto}>Volver</Text>
          </Pressable>

          <View style={styles.tarjeta}>
            {confirmacionPendiente ? (
              <>
                <View style={styles.encabezado}>
                  <Text style={styles.titulo}>Revisa tu correo</Text>
                  <Text style={styles.subtitulo}>
                    Enviamos un enlace de confirmación a {correo.trim()}. Ábrelo y luego inicia sesión.
                  </Text>
                </View>
                <Boton titulo="Ir a iniciar sesión" onPress={() => router.back()} />
              </>
            ) : (
              <>
                <View style={styles.encabezado}>
                  <Text style={styles.titulo}>Crear cuenta</Text>
                  <Text style={styles.subtitulo}>Completa tus datos para unirte a KanTask</Text>
                </View>

                <Campo
                  etiqueta="Nombre"
                  icono="perfil"
                  placeholder="Tu nombre"
                  autoComplete="name"
                  value={nombre}
                  onChangeText={setNombre}
                  error={errores.nombre}
                />
                <Campo
                  etiqueta="Correo electrónico"
                  icono="correo"
                  placeholder="usuario@kantask.dev"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={correo}
                  onChangeText={setCorreo}
                  error={errores.correo}
                />
                <Campo
                  etiqueta="Contraseña"
                  icono="candado"
                  placeholder="Mínimo 6 caracteres"
                  contrasena
                  autoComplete="new-password"
                  value={contrasena}
                  onChangeText={setContrasena}
                  error={errores.contrasena}
                />
                <Campo
                  etiqueta="Confirmar contraseña"
                  icono="candado"
                  placeholder="Repite la contraseña"
                  contrasena
                  autoComplete="new-password"
                  value={confirmar}
                  onChangeText={setConfirmar}
                  error={errores.confirmar}
                />

                {errores.general ? <Text style={styles.error}>{errores.general}</Text> : null}

                <Boton
                  titulo={enviando ? 'Creando cuenta…' : 'Crear cuenta'}
                  onPress={crearCuenta}
                  deshabilitado={enviando}
                />
              </>
            )}
          </View>

          <View style={styles.pie}>
            <Text style={styles.pieTexto}>
              ¿Ya tienes una cuenta?{' '}
              <Text style={styles.enlaceFuerte} onPress={() => router.back()}>
                Iniciar sesión
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Espacio.xl,
    gap: Espacio.xl,
  },
  volver: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espacio.xs,
  },
  volverTexto: {
    fontSize: 15,
    color: Colores.texto,
  },
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderRadius: Radio.xl,
    padding: Espacio.xl,
    gap: Espacio.lg,
    boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)',
  },
  encabezado: {
    gap: 2,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: Colores.texto,
  },
  subtitulo: {
    fontSize: 13,
    color: Colores.textoSecundario,
  },
  error: {
    fontSize: 13,
    color: Colores.peligro,
  },
  pie: {
    alignItems: 'center',
  },
  pieTexto: {
    fontSize: 13,
    color: Colores.textoSecundario,
  },
  enlaceFuerte: {
    color: Colores.primario,
    fontWeight: '700',
  },
});
