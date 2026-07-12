import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-otp-login',
  imports: [RouterLink],
  template: `
    <div class="auth-stub-page">
      <h1>Login with OTP</h1>
      <p>OTP authentication is coming soon.</p>
      <a routerLink="/login">Back to login</a>
    </div>
  `,
})
export class OtpLoginComponent {}
