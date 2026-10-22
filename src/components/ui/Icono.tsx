import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { Colores } from '@/constants/colores';

// SF Symbols en iOS y Material Symbols en Android / web
const ICONOS = {
  tablero: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  equipo: { ios: 'person.2', android: 'group', web: 'group' },
  actividad: { ios: 'bell', android: 'notifications', web: 'notifications' },
  perfil: { ios: 'person', android: 'person', web: 'person' },
  pulso: { ios: 'waveform.path.ecg', android: 'monitor_heart', web: 'monitor_heart' },
  correo: { ios: 'envelope', android: 'mail', web: 'mail' },
  candado: { ios: 'lock', android: 'lock', web: 'lock' },
  ojo: { ios: 'eye', android: 'visibility', web: 'visibility' },
  ojoCerrado: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  mas: { ios: 'plus', android: 'add', web: 'add' },
  calendario: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  reloj: { ios: 'clock', android: 'schedule', web: 'schedule' },
  atras: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  siguiente: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  opciones: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  checkCirculo: { ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' },
  camara: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' },
  galeria: { ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' },
  girarCamara: { ios: 'arrow.triangle.2.circlepath.camera', android: 'flip_camera_android', web: 'flip_camera_android' },
  flash: { ios: 'bolt', android: 'flash_on', web: 'flash_on' },
  cerrar: { ios: 'xmark', android: 'close', web: 'close' },
  buscar: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  agregarPersona: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
  filtros: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  editar: { ios: 'pencil', android: 'edit', web: 'edit' },
  telefono: { ios: 'phone', android: 'call', web: 'call' },
  seguridad: { ios: 'checkmark.shield', android: 'shield', web: 'shield' },
  idioma: { ios: 'character.bubble', android: 'translate', web: 'translate' },
  ayuda: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  salir: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  intercambio: { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' },
  documento: { ios: 'doc.text', android: 'assignment', web: 'assignment' },
  mensaje: { ios: 'bubble.left', android: 'chat_bubble', web: 'chat_bubble' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type NombreIcono = keyof typeof ICONOS;

type Props = {
  nombre: NombreIcono;
  tamano?: number;
  color?: ColorValue;
};

export function Icono({ nombre, tamano = 20, color = Colores.texto }: Props) {
  return <SymbolView name={ICONOS[nombre]} size={tamano} tintColor={color} />;
}
