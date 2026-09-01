import { Component, signal, inject, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="w-full bg-[#f4f7fa] rounded-2xl p-6 mb-6">
      <form (ngSubmit)="onSubmit()" #forgotForm="ngForm" class="space-y-5">
        
        <div>
          <label for="email" class="block font-mono-custom text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            CORREO ELECTRONICO
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
            </span>
            <input 
              id="email"
              name="email"
              type="email"
              required
              autocomplete="email"
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              placeholder="Ingresa tu correo institucional"
              class="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-xs font-mono-custom text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a1931] focus:border-transparent transition-all"
            />
          </div>
        </div>

        @if (mensaje()) {
          <p class="text-sm font-mono-custom" [class.text-green-600]="exito()" [class.text-red-600]="!exito()">
            {{ mensaje() }}
          </p>
        }

        @if (errorMsg()) {
          <p class="text-sm text-red-600 font-mono-custom" role="alert">{{ errorMsg() }}</p>
        }

        <button 
          type="submit" 
          [disabled]="cargando() || forgotForm.invalid"
          class="w-full bg-[#0a1931] hover:bg-blue-950 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono-custom text-sm font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md">
          {{ cargando() ? 'Enviando...' : 'Recuperar contrasena' }}
        </button>
      </form>
    </div>

    <button
      type="button"
      (click)="volver.emit()"
      class="w-full text-center font-mono-custom text-xs text-gray-500 hover:text-[#0a1931] transition-colors mb-8">
      Volver al inicio de sesion
    </button>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  readonly volver = output<void>();

  readonly email = signal("");
  readonly cargando = signal(false);
  readonly errorMsg = signal("");
  readonly mensaje = signal("");
  readonly exito = signal(false);

  onSubmit(): void {
    this.errorMsg.set("");
    this.mensaje.set("");
    this.cargando.set(true);

    this.auth.recuperarContrasena(this.email()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.mensaje.set("Se ha enviado un enlace de recuperacion a tu correo.");
        this.exito.set(true);
      },
      error: () => {
        this.cargando.set(false);
        this.errorMsg.set("No se pudo procesar la solicitud. Verifica tu correo.");
      },
    });
  }
}
