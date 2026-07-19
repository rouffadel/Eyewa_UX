import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './features/auth/guards/auth.guard';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { LoginComponent } from './features/auth/login/login.component';
import { OtpLoginComponent } from './features/auth/otp-login/otp-login.component';
import { CreateCustomerFormComponent } from './features/pos/customer/create-customer-form.component';
import { ReportsPageComponent } from './features/pos/reports/reports-page.component';
import { InsuranceFormComponent } from './features/pos/insurance/insurance-form.component';
import { PrescriptionFormComponent } from './features/pos/prescription/prescription-form.component';
import { PosTabPlaceholderComponent } from './features/pos/pos-tab-placeholder/pos-tab-placeholder.component';
import { ProfilePageComponent } from './features/pos/profile/profile-page.component';
import { PosShellComponent } from './features/pos/shell/pos-shell.component';
import { SellDashboardComponent } from './features/pos/sell/sell-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'otp-login', component: OtpLoginComponent, canActivate: [guestGuard] },
  {
    path: 'home',
    component: PosShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'sell', pathMatch: 'full' },
      { path: 'sell', component: SellDashboardComponent },
      {
        path: 'sell/invoice',
        loadComponent: () =>
          import('./features/pos/sell/invoice-preview/invoice-preview.component').then(
            (m) => m.InvoicePreviewComponent,
          ),
      },
      {
        path: 'prescription',
        children: [
          { path: '', component: PrescriptionFormComponent },
          {
            path: 'history',
            loadComponent: () =>
              import('./features/pos/prescription/prescription-history.component').then(
                (m) => m.PrescriptionHistoryComponent,
              ),
          },
        ],
      },
      {
        path: 'reports',
        component: ReportsPageComponent,
      },
      {
        path: 'measurements',
        loadComponent: () =>
          import('./features/pos/measurements/measurements-form.component').then(
            (m) => m.MeasurementsFormComponent,
          ),
      },
      {
        path: 'insurance',
        component: InsuranceFormComponent,
      },
      {
        path: 'more',
        component: PosTabPlaceholderComponent,
        data: { title: 'More' },
      },
      { path: 'profile', component: ProfilePageComponent },
      { path: 'createcustomer', component: CreateCustomerFormComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
