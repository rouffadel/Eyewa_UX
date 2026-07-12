import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink],
  template: `
    <div class="auth-stub-page">
      <h1>Forgot Password</h1>
      <p>Password recovery is coming soon.</p>
      <a routerLink="/login">Back to login</a>
    </div>
  `,
})
export class ForgotPasswordComponent {}
