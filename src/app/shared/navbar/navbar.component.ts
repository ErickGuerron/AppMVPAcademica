import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { AcademicoService } from "../../core/services/academico.service";

const MESES_CORTO = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Una coincidencia del buscador: a qué página lleva y por qué aparece. */
interface Resultado {
  titulo: string;
  detalle: string;
  icono: string;
  ruta: string;
}

interface Notificacion {
  titulo: string;
  detalle: string;
  icono: string;
  color: string;
  ruta: string;
}

/**
 * Notificaciones de ejemplo, mismo criterio que `PROXIMOS_EVENTOS` en
 * HorarioComponent: el API todavía no expone un endpoint de avisos, así que el
 * listado es fijo. Cuando exista, esto pasa a ser un computed sobre datos reales
 * sin tocar la plantilla.
 */
const NOTIFICACIONES: Notificacion[] = [
  {
    titulo: "Nueva calificación publicada",
    detalle: "Base de Datos · revisa tu nota",
    icono: "fa-solid fa-award",
    color: "bg-blue-50 text-blue-600",
    ruta: "/notas",
  },
  {
    titulo: "Entrega: Trabajo Final",
    detalle: "Vence el viernes a las 19:00",
    icono: "fa-regular fa-file-lines",
    color: "bg-amber-50 text-amber-600",
    ruta: "/horario",
  },
  {
    titulo: "Cambio de aula",
    detalle: "Computación Visual pasa a Laboratorio 3",
    icono: "fa-solid fa-location-dot",
    color: "bg-emerald-50 text-emerald-600",
    ruta: "/horario",
  },
];

/**
 * Barra superior (buscador, calendario, notificaciones, fecha, avatar)
 * compartida por todas las páginas autenticadas.
 *
 * Es completamente autónoma (sin @Input): resuelve el usuario actual
 * inyectando AuthService, así cualquier página bajo LayoutComponent la monta
 * con solo `<app-navbar />`, sin tener que pasarle datos desde afuera.
 */
@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./navbar.component.html",
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  private readonly academico = inject(AcademicoService);
  private readonly router = inject(Router);

  private readonly hoy = new Date();

  /** Fecha de hoy en formato corto tipo "1 Sep", para la píldora de fecha. */
  protected readonly fechaHoy = `${this.hoy.getDate()} ${MESES_CORTO[this.hoy.getMonth()]}`;

  /** Misma fecha en texto largo, solo para el tooltip de la píldora. */
  protected readonly fechaHoyLarga =
    `${this.hoy.getDate()} de ${MESES_LARGO[this.hoy.getMonth()]} de ${this.hoy.getFullYear()}`;

  protected readonly notificaciones = NOTIFICACIONES;

  protected readonly query = signal("");
  protected readonly panelNotis = signal(false);
  /** Se marcan como leídas al abrir el panel: apaga el punto azul del campanita. */
  protected readonly notisLeidas = signal(false);

  /**
   * Busca sobre los datos ya cargados (horario + calificaciones), sin pedir
   * nada nuevo al API: materias, profesores y aulas/categorías del estudiante.
   */
  protected readonly resultados = computed<Resultado[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (q.length < 2) return [];

    const vistos = new Set<string>();
    const salida: Resultado[] = [];

    const agregar = (r: Resultado) => {
      const clave = `${r.ruta}|${r.titulo}|${r.detalle}`;
      if (vistos.has(clave)) return;
      vistos.add(clave);
      salida.push(r);
    };

    for (const clase of this.academico.horario.value().horario) {
      const campos = [clase.curso, clase.profesor, clase.categoria];
      if (campos.some((c) => c.toLowerCase().includes(q))) {
        agregar({
          titulo: clase.curso,
          detalle: `${clase.profesor} · ${clase.categoria} · ${clase.dia} ${clase.horaInicio}`,
          icono: "fa-regular fa-calendar",
          ruta: "/horario",
        });
      }
    }

    for (const item of this.academico.calificaciones.value().calificaciones) {
      if ([item.curso, item.profesor].some((c) => c.toLowerCase().includes(q))) {
        agregar({
          titulo: item.curso,
          detalle: `Nota ${item.nota}/10 · ${item.profesor}`,
          icono: "fa-solid fa-award",
          ruta: "/notas",
        });
      }
    }

    return salida.slice(0, 6);
  });

  protected readonly buscando = computed(() => this.query().trim().length >= 2);

  abrirNotificaciones(): void {
    this.panelNotis.update((v) => !v);
    if (this.panelNotis()) this.notisLeidas.set(true);
  }

  /** Cierra buscador y notificaciones (backdrop, Escape o al elegir un resultado). */
  cerrarPaneles(): void {
    this.panelNotis.set(false);
    this.query.set("");
  }

  irA(ruta: string): void {
    this.cerrarPaneles();
    this.router.navigate([ruta]);
  }
}
