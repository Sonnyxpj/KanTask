import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  seleccionada?: Date | null;
  onSeleccionar: (fecha: Date) => void;
};

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function Calendario({ seleccionada, onSeleccionar }: Props) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicial = seleccionada ?? hoy;
  const [mes, setMes] = useState({ anio: inicial.getFullYear(), mes: inicial.getMonth() });

  const cambiarMes = (delta: number) =>
    setMes(({ anio, mes }) => {
      const d = new Date(anio, mes + delta, 1);
      return { anio: d.getFullYear(), mes: d.getMonth() };
    });

  // Semana comienza en lunes
  const desfase = (new Date(mes.anio, mes.mes, 1).getDay() + 6) % 7;
  const diasMes = new Date(mes.anio, mes.mes + 1, 0).getDate();
  const celdas: (Date | null)[] = [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from({ length: diasMes }, (_, i) => new Date(mes.anio, mes.mes, i + 1)),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Pressable onPress={() => cambiarMes(-1)} hitSlop={8} style={styles.flecha}>
          <Icono nombre="atras" tamano={16} color={Colores.texto} />
        </Pressable>
        <Text style={styles.titulo}>
          {MESES[mes.mes]} {mes.anio}
        </Text>
        <Pressable onPress={() => cambiarMes(1)} hitSlop={8} style={styles.flecha}>
          <Icono nombre="siguiente" tamano={16} color={Colores.texto} />
        </Pressable>
      </View>

      <View style={styles.fila}>
        {DIAS.map((d) => (
          <Text key={d} style={[styles.celda, styles.diaSemana]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grilla}>
        {celdas.map((fecha, i) => {
          if (!fecha) return <View key={i} style={styles.celda} />;
          const pasado = fecha < hoy;
          const activo = seleccionada ? mismoDia(fecha, seleccionada) : false;
          const esHoy = mismoDia(fecha, hoy);
          return (
            <Pressable
              key={i}
              disabled={pasado}
              onPress={() => onSeleccionar(fecha)}
              style={styles.celda}>
              <View style={[styles.dia, esHoy && styles.diaHoy, activo && styles.diaActivo]}>
                <Text
                  style={[
                    styles.diaTexto,
                    pasado && { color: Colores.textoTenue },
                    esHoy && { color: Colores.primario },
                    activo && { color: Colores.superficie },
                  ]}>
                  {fecha.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: Espacio.md,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
    gap: Espacio.sm,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flecha: {
    padding: Espacio.xs,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: Colores.texto,
  },
  fila: {
    flexDirection: 'row',
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  celda: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaSemana: {
    aspectRatio: undefined,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colores.textoSecundario,
  },
  dia: {
    width: '80%',
    height: '80%',
    borderRadius: Radio.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaHoy: {
    borderWidth: 1,
    borderColor: Colores.primario,
  },
  diaActivo: {
    backgroundColor: Colores.marino,
    borderColor: Colores.marino,
  },
  diaTexto: {
    fontSize: 14,
    fontWeight: '500',
    color: Colores.texto,
  },
});
