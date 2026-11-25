import { aTextoFecha, estaVencida, formatearFecha, formatearHace, leerTextoFecha } from '@/lib/fechas';

// Fecha fija para que los resultados no dependan del día en que se corren las pruebas
const AHORA = new Date(2026, 10, 23, 10, 0); // 23-11-2026 10:00 (hora local)

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(AHORA);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('leerTextoFecha (campo "Fecha límite" del formulario)', () => {
  it('lee fecha y hora en formato DD-MM-AAAA HH:MM', () => {
    expect(leerTextoFecha('24-11-2026 14:30')).toEqual(new Date(2026, 10, 24, 14, 30));
  });

  it('sin hora usa el final del día (23:59)', () => {
    expect(leerTextoFecha('24-11-2026')).toEqual(new Date(2026, 10, 24, 23, 59));
  });

  it('acepta días y meses de un dígito y espacios alrededor', () => {
    expect(leerTextoFecha('  5-3-2027 9:05 ')).toEqual(new Date(2027, 2, 5, 9, 5));
  });

  it.each(['31-02-2026', '30-02-2028 10:00', '00-01-2026', '15-13-2026', '10-10-2026 24:00', '10-10-2026 10:60'])(
    'rechaza la fecha imposible %s',
    (texto) => {
      expect(leerTextoFecha(texto)).toBeNull();
    },
  );

  it.each(['', 'mañana', '2026-11-24', '24/11/2026', '24-11-26'])('rechaza el formato inválido "%s"', (texto) => {
    expect(leerTextoFecha(texto)).toBeNull();
  });

  it('es inversa de aTextoFecha (precarga al editar)', () => {
    const fecha = new Date(2026, 11, 1, 8, 15);
    expect(aTextoFecha(fecha)).toBe('01-12-2026 08:15');
    expect(leerTextoFecha(aTextoFecha(fecha))).toEqual(fecha);
  });
});

describe('formatearFecha (tarjetas y detalle)', () => {
  it('usa Hoy, Mañana y Ayer', () => {
    expect(formatearFecha(new Date(2026, 10, 23, 11, 30).toISOString())).toBe('Hoy · 11:30');
    expect(formatearFecha(new Date(2026, 10, 24, 9, 0).toISOString())).toBe('Mañana · 09:00');
    expect(formatearFecha(new Date(2026, 10, 22, 18, 0).toISOString())).toBe('Ayer · 18:00');
  });

  it('muestra día y mes para otras fechas, y el año si no es el actual', () => {
    expect(formatearFecha(new Date(2026, 11, 5, 9, 0).toISOString())).toBe('5 dic · 09:00');
    expect(formatearFecha(new Date(2027, 0, 5, 9, 0).toISOString())).toBe('5 ene 2027 · 09:00');
  });
});

describe('estaVencida', () => {
  it('distingue fechas pasadas y futuras', () => {
    expect(estaVencida(new Date(2026, 10, 23, 9, 59).toISOString())).toBe(true);
    expect(estaVencida(new Date(2026, 10, 23, 10, 1).toISOString())).toBe(false);
  });

  it('un texto inválido no cuenta como vencido', () => {
    expect(estaVencida('no es fecha')).toBe(false);
  });
});

describe('formatearHace (feed de Actividad)', () => {
  const hace = (min: number) => new Date(AHORA.getTime() - min * 60_000).toISOString();

  it.each([
    [0, 'Hace un momento'],
    [5, 'Hace 5 min'],
    [60, 'Hace 1 hora'],
    [180, 'Hace 3 horas'],
    [60 * 24, 'Ayer'],
    [60 * 24 * 3, 'Hace 3 días'],
  ])('hace %i minutos → %s', (min, esperado) => {
    expect(formatearHace(hace(min))).toBe(esperado);
  });
});
