import { Component, inject, signal } from "@angular/core";
import { RouterOutlet, Router, NavigationEnd } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { NavbarComponent } from "../navbar/navbar.component";

interface RouteHeaderData {
  breadcrumb: string;
  title: string;
}

@Component({
  selector: "app-layout",
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: "./layout.component.html",
})
export class LayoutComponent {
  private readonly router = inject(Router);

  /**
   * Estado del drawer móvil. Se cierra automáticamente al navegar para
   * evitar que el sidebar tape la pantalla al cambiar de ruta en móvil.
   */
  protected readonly sidebarOpen = signal(false);

  /**
   * Lee { breadcrumb, title } de la ruta hija activa para el header.
   *
   * Importante: caminamos por el árbol de SNAPSHOTS (`routerState.snapshot.root`),
   * no por el árbol "vivo" de ActivatedRoute (`ActivatedRoute.firstChild`).
   * Mezclar ambos (caminar por el vivo y al final leer `.snapshot`) puede
   * fallar justo durante una navegación, porque el nodo `firstChild` vivo
   * puede quedar momentáneamente sin snapshot mientras el router reorganiza
   * el árbol. Empezando ya en modo snapshot, cada nodo trae `.data` directo
   * y no hay ninguna ventana de inconsistencia.
   */
  protected readonly header = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map((): RouteHeaderData => {
        let snapshot = this.router.routerState.snapshot.root;
        while (snapshot.firstChild) snapshot = snapshot.firstChild;
        const data = snapshot.data as Partial<RouteHeaderData>;
        return {
          breadcrumb: data.breadcrumb ?? "",
          title: data.title ?? "",
        };
      })
    ),
    { initialValue: { breadcrumb: "", title: "" } }
  );

  constructor() {
    // Cierra el drawer en cada navegación para que no tape la nueva vista en móvil.
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.sidebarOpen.set(false));
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
