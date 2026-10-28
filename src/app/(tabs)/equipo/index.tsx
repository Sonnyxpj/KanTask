import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiembroItem } from '@/components/equipo/MiembroItem';
import { ModalRol } from '@/components/equipo/ModalRol';
import { BadgeEnVivo, Chip } from '@/components/ui/Badge';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { useEquipo } from '@/lib/equipo';
import { contarTareasPorUsuario } from '@/services/usuarios';
import type { Usuario } from '@/types/modelos';

const ORDEN = ['Por asignado', 'Por rol: Editor/Visualizador', 'En vivo'] as const;
type Orden = (typeof ORDEN)[number];

// Pantalla 5 · Equipo en vivo
export default function Equipo() {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<Orden>('Por asignado');
  const [editandoRol, setEditandoRol] = useState<Usuario | null>(null);
  const [tareasPorUsuario, setTareasPorUsuario] = useState<Record<string, number>>({});
  // Quién está en vivo lo calcula ProveedorEquipo con Realtime Presence
  const { usuarios, actual, cargando, error, recargar } = useEquipo();
  const esEditor = actual?.rol === 'editor';

  // Recargar cada vez que se abre la pestaña (p. ej. alguien nuevo se registró)
  useFocusEffect(
    useCallback(() => {
      recargar();
      contarTareasPorUsuario().then(setTareasPorUsuario).catch(() => {});
    }, [recargar]),
  );

  const tareasDe = (id: string) => tareasPorUsuario[id] ?? 0;
  const totalTareas = Object.values(tareasPorUsuario).reduce((a, b) => a + b, 0);
  const conectados = usuarios.filter((u) => u.enVivo).length;
  const porcentajeConectado = usuarios.length ? Math.round((conectados / usuarios.length) * 100) : 0;

  const miembros = usuarios.filter((u) => u.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .filter((u) => orden !== 'En vivo' || u.enVivo)
    .sort((a, b) =>
      orden === 'Por rol: Editor/Visualizador' ? a.rol.localeCompare(b.rol) : tareasDe(b.id) - tareasDe(a.id),
    );

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <Encabezado
        titulo="Equipo en vivo"
        subtitulo={[actual?.turno, `${usuarios.length} integrantes`].filter(Boolean).join(' · ')}
      />

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.buscador}>
          <Icono nombre="buscar" tamano={18} color={Colores.textoTenue} />
          <TextInput
            placeholder="Buscar miembros del equipo"
            placeholderTextColor={Colores.textoTenue}
            value={busqueda}
            onChangeText={setBusqueda}
            style={styles.input}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {ORDEN.map((o) => (
            <Chip key={o} texto={o} activo={orden === o} onPress={() => setOrden(o)} />
          ))}
        </ScrollView>

        <View style={styles.resumen}>
          <View style={styles.dato}>
            <Text style={styles.datoNumero}>{totalTareas}</Text>
            <Text style={styles.datoTexto}>Tareas asignadas</Text>
          </View>
          <View style={styles.dato}>
            <Text style={styles.datoNumero}>{porcentajeConectado}%</Text>
            <Text style={styles.datoTexto}>Equipo conectado</Text>
          </View>
          <BadgeEnVivo texto="Sinc. en vivo" />
        </View>

        <Text style={styles.seccion}>MIEMBROS DEL EQUIPO</Text>
        <View style={styles.lista}>
          {cargando ? (
            <ActivityIndicator color={Colores.primario} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : miembros.length === 0 ? (
            <Text style={styles.vacio}>No hay integrantes que coincidan con la búsqueda</Text>
          ) : (
            miembros.map((u) => (
              <MiembroItem
                key={u.id}
                usuario={u}
                tareas={tareasDe(u.id)}
                // Un editor puede cambiar el rol de los demás, no el suyo
                onPress={esEditor && u.id !== actual?.id ? () => setEditandoRol(u) : undefined}
              />
            ))
          )}
        </View>
      </ScrollView>

      <ModalRol usuario={editandoRol} onCerrar={() => setEditandoRol(null)} onCambiado={recargar} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  contenido: {
    paddingBottom: Espacio.xl,
    gap: Espacio.lg,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
    marginHorizontal: Espacio.lg,
    paddingHorizontal: Espacio.md,
    minHeight: 44,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colores.texto,
  },
  filtros: {
    paddingHorizontal: Espacio.lg,
    gap: Espacio.sm,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espacio.xl,
    marginHorizontal: Espacio.lg,
    padding: Espacio.lg,
    borderRadius: Radio.md,
    backgroundColor: Colores.primarioSuave,
  },
  dato: {
    gap: 2,
  },
  datoNumero: {
    fontSize: 24,
    fontWeight: '500',
    color: Colores.texto,
  },
  datoTexto: {
    fontSize: 11,
    color: Colores.textoSecundario,
  },
  seccion: {
    paddingHorizontal: Espacio.lg,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colores.textoSecundario,
    marginBottom: -Espacio.sm,
  },
  lista: {
    paddingHorizontal: Espacio.lg,
    gap: Espacio.sm,
  },
  error: {
    fontSize: 13,
    color: Colores.peligro,
  },
  vacio: {
    fontSize: 13,
    color: Colores.textoSecundario,
  },
});
