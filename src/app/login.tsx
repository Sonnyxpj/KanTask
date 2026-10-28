import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { useSesion } from '@/lib/sesion';

// Pantalla 1 · Login
export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { iniciarSesion, modoDemo } = useSesion();

  const ingresar = async () => {
    if (modoDemo) {
      router.replace('/tablero');
      return;
    }
    if (!correo.trim() || !contrasena) {
      setError('Ingresa tu correo y contraseña');
      return;
    }
    setError('');
    setEnviando(true);
    const resultado = await iniciarSesion(correo, contrasena);
    setEnviando(false);
    // Si no hay error, el Stack.Protected del layout redirige al tablero
    if (resultado.error) setError(resultado.error);
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.marca}>
            <View style={styles.logo}>
              <Icono nombre="pulso" tamano={26} color="#FFFFFF" />
            </View>
            <Text style={styles.nombreApp}>KanTask</Text>
            <Text style={styles.lema}>GESTIÓN DE TAREAS EN EQUIPO</Text>
          </View>

          <View style={styles.tarjeta}>
            <View style={styles.encabezado}>
              <Text style={styles.titulo}>Ingresar al sistema</Text>
              <Text style={styles.subtitulo}>Ingresa tus credenciales autorizadas</Text>
            </View>

            <Campo
              etiqueta="Correo electrónico"
              icono="correo"
              placeholder="usuario@kantask.dev"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={correo}
              onChangeText={setCorreo}
            />
            <Campo
              etiqueta="Contraseña"
              icono="candado"
              placeholder="••••••••••••"
              contrasena
              value={contrasena}
              onChangeText={setContrasena}
            />

            <Pressable style={styles.olvido} onPress={() => router.push('/recuperar')}>
              <Text style={styles.enlace}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Boton
              titulo={enviando ? 'Ingresando…' : 'Iniciar sesión'}
              onPress={ingresar}
              deshabilitado={enviando}
            />
          </View>

          <View style={styles.pie}>
            <Text style={styles.pieTexto}>
              ¿No tienes una cuenta?{' '}
              <Link href="/registro" style={styles.enlaceFuerte}>
                Crear cuenta
              </Link>
            </Text>
            <View style={styles.estado}>
              <View style={[styles.punto, modoDemo && styles.puntoDemo]} />
              <Text style={styles.pieTexto}>{modoDemo ? 'Modo demo (sin servidor)' : 'Servidor en línea'}</Text>
            </View>
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
    gap: Espacio.xxl,
  },
  marca: {
    alignItems: 'center',
    gap: Espacio.sm,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: Radio.lg,
    backgroundColor: Colores.marino,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espacio.sm,
  },
  nombreApp: {
    fontSize: 30,
    fontWeight: '800',
    color: Colores.marino,
  },
  lema: {
    fontSize: 12,
    letterSpacing: 1,
    color: Colores.textoSecundario,
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
  olvido: {
    alignSelf: 'flex-end',
    marginTop: -Espacio.sm,
  },
  enlace: {
    fontSize: 13,
    color: Colores.primario,
  },
  pie: {
    alignItems: 'center',
    gap: Espacio.sm,
  },
  pieTexto: {
    fontSize: 13,
    color: Colores.textoSecundario,
  },
  error: {
    fontSize: 13,
    color: Colores.peligro,
  },
  enlaceFuerte: {
    color: Colores.primario,
    fontWeight: '700',
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.xs + 2,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colores.exito,
  },
  puntoDemo: {
    backgroundColor: Colores.textoTenue,
  },
});
