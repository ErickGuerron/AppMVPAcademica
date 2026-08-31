import { Component, inject } from "@angular/core";
import { AcademicoService } from "../../core/services/academico.service";

@Component({
  selector: "app-notas",
  standalone: true,
  templateUrl: "./notas.component.html",
})
export class NotasComponent {
  protected readonly academico = inject(AcademicoService);
}
