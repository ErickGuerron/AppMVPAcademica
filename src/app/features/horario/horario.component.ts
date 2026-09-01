import { Component, computed, inject, signal } from "@angular/core";
import { AcademicoService } from "../../core/services/academico.service";
import { HorarioItem } from "../../core/models/models";

interface DiaPill {
  abbr: string;
  fecha: number;
  nombreLargo: string;
}

interface DiaResumen {
  abbr: string;
  horas: number;
  /** Ancho relativo (0-100) de la barra, respecto al día con más horas de la semana. */
  porcentaje: number;
}

type Modalidad = "Presencial" | "Virtual";
type Filtro = "todas" | "presencial" | "virtual";

interface ClaseVista extends HorarioItem {
  iniciales: string;
  color: { bg: string; text: string };
  modalidad: Modalidad;
  lugar: string;
}

interface EventoProximo {
  dia: string;
  fecha: number;
  hora: string;
  titulo: string;
  detalle: string;
  icono: string;
  color: string;
}

const DIAS: DiaPill[] = [
  { abbr: "LUN", fecha: 24, nombreLargo: "Lunes" },
  { abbr: "MAR", fecha: 25, nombreLargo: "Martes" },
  { abbr: "MIE", fecha: 26, nombreLargo: "Miércoles" },
  { abbr: "JUE", fecha: 27, nombreLargo: "Jueves" },
  { abbr: "VIE", fecha: 28, nombreLargo: "Viernes" },
];

/** getDay() -> abreviatura de la tira. Sábado y domingo quedan fuera de la semana mock. */
const ABBR_POR_DIA_JS: (string | null)[] = [null, "LUN", "MAR", "MIE", "JUE", "VIE", null];

const PALETA_AVATARES = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-cyan-100", text: "text-cyan-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
];

/**
 * Próximos eventos: dato de ejemplo fijo, igual que "asistencia"/"creditos"/"ranking"
 * en ResumenComponent. El API todavía no expone tareas/exámenes; cuando exista ese
 * endpoint, esto se reemplaza por un computed sobre datos reales sin tocar la plantilla.
 */
const PROXIMOS_EVENTOS: EventoProximo[] = [
  { dia: "VIE", fecha: 28, hora: "19:00", titulo: "Entrega: Trabajo Final", detalle: "Arquitectura de Software", icono: "fa-regular fa-file-lines", color: "bg-blue-50 text-blue-600" },
  { dia: "SAB", fecha: 29, hora: "10:00", titulo: "Examen Parcial", detalle: "Inteligencia de Negocios", icono: "fa-solid fa-triangle-exclamation", color: "bg-amber-50 text-amber-600" },
  { dia: "LUN", fecha: 31, hora: "08:00", titulo: "Inicio de Módulo 3", detalle: "Sistemas Distribuidos", icono: "fa-solid fa-book-open", color: "bg-emerald-50 text-emerald-600" },
];

function horaAHoras(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h + (m || 0) / 60;
}

function duracionHoras(item: HorarioItem): number {
  return Math.max(0, horaAHoras(item.horaFin) - horaAHoras(item.horaInicio));
}

function hashCurso(curso: string): number {
  let h = 0;
  for (let i = 0; i < curso.length; i++) h = (h * 31 + curso.charCodeAt(i)) >>> 0;
  return h;
}

@Component({
  selector: "app-horario",
  standalone: true,
  templateUrl: "./horario.component.html",
})
export class HorarioComponent {
  protected readonly academico = inject(AcademicoService);

  protected readonly dias = DIAS;
  protected readonly proximosEventos = PROXIMOS_EVENTOS;

  /** Abreviatura del día de hoy, o null si hoy es fin de semana. */
  protected readonly hoyAbbr = ABBR_POR_DIA_JS[new Date().getDay()];

  /** Arranca en el día de hoy; si hoy es fin de semana, en el lunes de la semana mock. */
  readonly diaSeleccionado = signal(this.hoyAbbr ?? "LUN");
  readonly filtro = signal<Filtro>("todas");

  private readonly horarioSemana = computed(() => this.academico.horario.value().horario ?? []);

  protected readonly diaActual = computed(
    () => this.dias.find((d) => d.abbr === this.diaSeleccionado()) ?? this.dias[0]
  );

  /**
   * Enriquece cada clase con iniciales/color (derivados del curso, como en Resumen y
   * Calificaciones) y con modalidad/lugar. El API aún no trae aula ni modalidad, así
   * que se derivan de forma estable a partir del nombre del curso: mismo curso, siempre
   * el mismo resultado. Se reemplaza por los campos reales en cuanto existan.
   */
  private enriquecer(item: HorarioItem): ClaseVista {
    const hash = hashCurso(item.curso);
    const palabras = item.curso.split(/\s+/).filter(Boolean);
    const iniciales =
      palabras.length > 1 ? (palabras[0][0] + palabras[1][0]).toUpperCase() : item.curso.slice(0, 2).toUpperCase();
    const esVirtual = hash % 4 === 0;
    return {
      ...item,
      iniciales,
      color: PALETA_AVATARES[hash % PALETA_AVATARES.length],
      modalidad: esVirtual ? "Virtual" : "Presencial",
      lugar: esVirtual ? "Videollamada" : `Laboratorio ${(hash % 4) + 1}`,
    };
  }

  readonly clasesDelDia = computed<ClaseVista[]>(() => {
    const clases = this.horarioSemana()
      .filter((h) => h.dia === this.diaSeleccionado())
      .map((h) => this.enriquecer(h));

    const f = this.filtro();
    if (f === "todas") return clases;
    return clases.filter((c) => c.modalidad.toLowerCase() === f);
  });

  /** Número de clases por día, para el contador de cada ficha de la tira. */
  readonly clasesPorDia = computed<Record<string, number>>(() => {
    const conteo: Record<string, number> = {};
    for (const dia of this.dias) conteo[dia.abbr] = 0;
    for (const item of this.horarioSemana()) {
      if (conteo[item.dia] !== undefined) conteo[item.dia]++;
    }
    return conteo;
  });

  /** Lista auxiliar para pintar un punto por clase en la ficha del día. */
  marcadores(cantidad: number): number[] {
    return Array.from({ length: cantidad }, (_, i) => i);
  }

  /** Vuelve al día de hoy desde el botón "Hoy" de la tira. */
  irAHoy(): void {
    if (this.hoyAbbr) this.diaSeleccionado.set(this.hoyAbbr);
  }

  seleccionarDia(abbr: string): void {
    this.diaSeleccionado.set(abbr);
  }

  seleccionarFiltro(f: Filtro): void {
    this.filtro.set(f);
  }

  /** Horas totales programadas en la semana (suma de todas las clases). */
  readonly horasSemana = computed(() =>
    this.horarioSemana().reduce((total, item) => total + duracionHoras(item), 0)
  );

  readonly totalMaterias = computed(() => new Set(this.horarioSemana().map((h) => h.curso)).size);

  readonly totalSesiones = computed(() => this.horarioSemana().length);

  /** Horas por día de la semana, para la barra de "Resumen semanal". */
  readonly resumenPorDia = computed<DiaResumen[]>(() => {
    const items = this.horarioSemana();
    const horasPorDia = this.dias.map((dia) => ({
      abbr: dia.abbr,
      horas: items.filter((h) => h.dia === dia.abbr).reduce((total, h) => total + duracionHoras(h), 0),
    }));
    const maxHoras = Math.max(1, ...horasPorDia.map((d) => d.horas));
    return horasPorDia.map((d) => ({ ...d, porcentaje: (d.horas / maxHoras) * 100 }));
  });

  claseCategoriaClase(categoria: string): string {
    return categoria === "APE" ? "text-amber-600" : "text-blue-600";
  }

  exportarHorario(): void {
    const filas = this.horarioSemana();
    const contenido = filas
      .map((h) => `${h.dia} ${h.horaInicio}-${h.horaFin};${h.curso};${h.profesor}`)
      .join("\n");
    const blob = new Blob([`Día Horario;Curso;Profesor\n${contenido}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mi-horario.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}
