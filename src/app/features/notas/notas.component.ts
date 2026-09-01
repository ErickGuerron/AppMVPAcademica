import { Component, computed, inject, signal } from "@angular/core";
import { AcademicoService } from "../../core/services/academico.service";
import { CalificacionItem } from "../../core/models/models";

type Orden = "nota-desc" | "nota-asc" | "nombre";

const PALETA_AVATARES = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-cyan-100", text: "text-cyan-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
];

@Component({
  selector: "app-notas",
  standalone: true,
  templateUrl: "./notas.component.html",
})
export class NotasComponent {
  protected readonly academico = inject(AcademicoService);

  readonly orden = signal<Orden>("nombre");

  protected readonly calificaciones = computed(() => this.academico.calificaciones.value().calificaciones);

  protected readonly calificacionesOrdenadas = computed(() => {
    const items = [...this.calificaciones()];
    switch (this.orden()) {
      case "nota-desc":
        return items.sort((a, b) => b.nota - a.nota);
      case "nota-asc":
        return items.sort((a, b) => a.nota - b.nota);
      default:
        return items.sort((a, b) => a.curso.localeCompare(b.curso));
    }
  });

  cambiarOrden(orden: Orden): void {
    this.orden.set(orden);
  }

  /** Clasificación derivada de la nota (no viene del API: se calcula sobre el dato real). */
  estadoNota(nota: number): { texto: string; bg: string; text: string } {
    if (nota >= 9) return { texto: "Excelente", bg: "bg-emerald-50", text: "text-emerald-600" };
    if (nota >= 7) return { texto: "Aprobada", bg: "bg-blue-50", text: "text-blue-600" };
    return { texto: "En riesgo", bg: "bg-red-50", text: "text-red-600" };
  }

  inicialesCurso(curso: string): string {
    const palabras = curso.split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return "?";
    if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  avatarCurso(curso: string): { bg: string; text: string } {
    const index = this.calificaciones().findIndex((c) => c.curso === curso);
    return PALETA_AVATARES[Math.max(0, index) % PALETA_AVATARES.length];
  }

  exportarCalificaciones(): void {
    const filas: CalificacionItem[] = this.calificaciones();
    const contenido = filas.map((c) => `${c.curso};${c.profesor};${c.nota}`).join("\n");
    const blob = new Blob([`Curso;Profesor;Nota\n${contenido}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mis-calificaciones.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}
