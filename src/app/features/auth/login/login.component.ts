import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppConfigService } from '../../../services/app-config.service';
import { LoginError } from '../models/login.error';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly appConfig = inject(AppConfigService);

  protected readonly hidePassword = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [true],
  });

  protected get supportMailto(): string {
    const email = this.appConfig.settings?.supportEmail ?? 'support@fadelsoft.com';
    return `mailto:${email}`;
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  protected onSubmit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.form.getRawValue())
      .then(() => {
        void this.router.navigate(['/home']);
      })
      .catch((error: unknown) => {
        if (error instanceof LoginError) {
          this.errorMessage.set(error.message);
          return;
        }

        this.errorMessage.set('Something went wrong. Please try again.');
      })
      .finally(() => {
        this.isSubmitting.set(false);
      });
  }
}
