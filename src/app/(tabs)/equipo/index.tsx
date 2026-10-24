import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InvitacionItem } from '@/components/equipo/InvitacionItem';
import { MiembroItem } from '@/components/equipo/MiembroItem';
import { ModalInvitar } from '@/components/equipo/ModalInvitar';
import { BadgeEnVivo, Chip } from '@/components/ui/Badge';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { TAREAS, USUARIO_ACTUAL, USUARIOS } from '@/constants/datos-demo';
import { cancelarInvitacion, listarInvitaciones } from '@/services/invitaciones';
import type { Invitacion } from '@/types/modelos';

const ORDEN = ['Por asignado', 'Por rol: Editor/Visualizador', 'En vivo'] as const;
type Orden = (typeof ORDEN)[number];

// Pantalla 5 · Equipo en vivo
export default function Equipo() {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<Orden>('Por asignado');
  const [invitando, setInvitando] = useState(false);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const puedeInvitar = USUARIO_ACTUAL.rol === 'editor';

  useEffect(() => {
    listarInvitaciones().then(setInvitaciones).catch(() => {});
  }, []);

  const cancelar = (inv: Invitacion) =>
    Alert.alert('Cancelar invitación', `¿Quitar la invitación de ${inv.nombre}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () =>
          cancelarInvitacion(inv.id)
            .then(() => setInvitaciones((l) => l.filter((i) => i.id !== inv.id)))
            .catch((e: Error) => Alert.alert('Error', e.message)),
      },
    ]);

  const tareasDe = (id: string) => TAREAS.filter((t) => t.asignadoA === id).length;
  const conectados = USUARIOS.filter((u) => u.enVivo).length;

  const miembros = USUARIOS.filter((u) => u.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .filter((u) => orden !== 'En vivo' || u.enVivo)
    .sort((a, b) =>
      orden === 'Por rol: Editor/Visualizador' ? a.rol.localeCompare(b.rol) : tareasDe(b.id) - tareasDe(a.id),
    );

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <Encabezado
        titulo="Equipo en vivo"
        subtitulo={`${USUARIO_ACTUAL.turno} · ${USUARIOS.length} integrantes`}
        accion={
          puedeInvitar && (
            <Pressable onPress={() => setInvitando(true)} hitSlop={8} accessibilityLabel="Agregar integrante">
              <Icono nombre="agregarPersona" color={Colores.textoSecundario} />
            </Pressable>
          )
        }
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
            <Text style={styles.datoNumero}>{TAREAS.length}</Text>
            <Text style={styles.datoTexto}>Tareas asignadas</Text>
          </View>
          <View style={styles.dato}>
            <Text style={styles.datoNumero}>{Math.round((conectados / USUARIOS.length) * 100)}%</Text>
            <Text style={styles.datoTexto}>Equipo conectado</Text>
          </View>
          <BadgeEnVivo texto="Sinc. en vivo" />
        </View>

        <Text style={styles.seccion}>MIEMBROS DEL EQUIPO</Text>
        <View style={styles.lista}>
          {miembros.map((u) => (
            <MiembroItem key={u.id} usuario={u} tareas={tareasDe(u.id)} />
          ))}
        </View>

        {invitaciones.length > 0 && (
          <>
            <Text style={styles.seccion}>INVITACIONES PENDIENTES</Text>
            <View style={styles.lista}>
              {invitaciones.map((inv) => (
                <InvitacionItem key={inv.id} invitacion={inv} onCancelar={puedeInvitar ? () => cancelar(inv) : undefined} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <ModalInvitar
        visible={invitando}
        onCerrar={() => setInvitando(false)}
        onInvitado={(inv) => setInvitaciones((l) => [inv, ...l])}
      />
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
});
