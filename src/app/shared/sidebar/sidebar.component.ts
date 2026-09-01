import { Component, inject, input } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

/**
 * Menú lateral oscuro (paleta AURA) compartido por todas las páginas
 * autenticadas. Autónomo respecto a sesión/usuario (inyecta AuthService y
 * Router directamente), así que se monta con solo `<app-sidebar [open]="..." />`.
 *
 * El estado de apertura del drawer móvil lo sigue controlando LayoutComponent
 * (backdrop, botón hamburguesa y cierre al navegar viven ahí); este
 * componente solo refleja ese estado en sus clases de transformación.
 */
@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: "./sidebar.component.html",
  // `display: contents` saca al host <app-sidebar> del layout: el <aside> de
  // adentro pasa a ser el hijo flex directo de LayoutComponent (igual que antes
  // de extraerlo a componente), así vuelve a estirarse al 100% de la altura con
  // el `align-items: stretch` del flex del layout. Sin esto, el host sí se
  // estira pero el <aside> se queda con el alto de su contenido y deja un hueco
  // gris debajo.
  host: { class: "contents" },
})
export class SidebarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Si el drawer está abierto en móvil/tablet (en lg+ el sidebar siempre es visible). */
  readonly open = input(false);

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(["/login"]);
  }
}
