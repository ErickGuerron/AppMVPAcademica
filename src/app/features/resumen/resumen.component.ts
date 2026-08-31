import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AcademicoService } from "../../core/services/academico.service";
import { AuthService } from "../../core/services/auth.service";

const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PALETA_AVATARES = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-cyan-100", text: "text-cyan-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
];

@Component({
  selector: "app-resumen",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./resumen.component.html",
})
export class ResumenComponent {
  protected readonly academico = inject(AcademicoService);
  protected readonly auth = inject(AuthService);

  protected readonly hoy = new Date();
  protected readonly nombreDia = DIAS_LARGO[this.hoy.getDay()];
  protected readonly mesLargo = MESES_LARGO[this.hoy.getMonth()];
  protected readonly fechaCorta = `${this.hoy.getDate()} ${MESES_LARGO[this.hoy.getMonth()].slice(0, 3)}`;

  protected readonly nombreUsuario = computed(() => {
    const u = this.auth.usuario();
    return u ? u.nombre.split(" ")[0] : "";
  });

  protected readonly inicialesUsuario = computed(() => this.auth.usuario()?.iniciales ?? "");

  protected readonly clases = computed(() => this.academico.horario.value().horario);

  protected readonly totalCursos = computed(() => this.academico.calificaciones.value().calificaciones.length);

  protected readonly promedio = computed(() => this.academico.calificaciones.value().promedio);

  protected readonly proximaClase = computed(() => this.clases()[0] ?? null);

  protected readonly saludo = computed(() => {
    const hora = this.hoy.getHours();
    if (hora < 12) return "Buenos dias";
    if (hora < 19) return "Buenas tardes";
    return "Buenas noches";
  });

  /**
   * Resumen rapido: métricas que en el diseño original venían hardcodeadas.
   * Cuando existan endpoints reales, basta con reemplazar estos valores por
   * signals del AcademicoService sin tocar la plantilla.
   */
  protected readonly asistencia = 92;
  protected readonly creditos = "24/30";
  protected readonly ranking = "Top 15%";
  protected readonly tareasPendientes = 2;

  protected inicialesCurso(curso: string): string {
    const palabras = curso.split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return "?";
    if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  protected avatarClase(index: number): { bg: string; text: string } {
    return PALETA_AVATARES[index % PALETA_AVATARES.length];
  }
}
