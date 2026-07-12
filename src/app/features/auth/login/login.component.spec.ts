import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { AppConfigService } from '../../../services/app-config.service';
import { LoginError, LoginErrorCode } from '../models/login.error';

@Component({ template: '' })
class RouteStubComponent {}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['login']);
    authService.login.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([
          {
            path: 'home',
            component: RouteStubComponent,
            children: [{ path: '**', component: RouteStubComponent }],
          },
        ]),
        { provide: AuthService, useValue: authService },
        {
          provide: AppConfigService,
          useValue: { settings: { supportEmail: 'support@fadelsoft.com' } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render branding panel content from reference', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('EYEWA ERP');
    expect(compiled.textContent).toContain('Manage your optical business with ease');
    expect(compiled.textContent).toContain('Smart Store Management');
    expect(compiled.textContent).toContain('Powered by');
    expect(compiled.textContent).toContain('FADEL');
  });

  it('should render login form copy from reference', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome Back!');
    expect(compiled.textContent).toContain('Sign in to your Eyewa ERP account');
  });

  it('should be invalid when fields are empty', () => {
    expect(component['form'].valid).toBeFalse();
  });

  it('should block submit when form is invalid', () => {
    component['onSubmit']();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should default remember me to checked', () => {
    expect(component['form'].controls.rememberMe.value).toBeTrue();
  });

  it('should toggle password visibility', () => {
    expect(component['hidePassword']()).toBeTrue();
    component['togglePasswordVisibility']();
    expect(component['hidePassword']()).toBeFalse();
  });

  it('should call AuthService.login with form values on valid submit', fakeAsync(() => {
    component['form'].setValue({
      identifier: 'staff@eyewa.com',
      password: 'demo1234',
      rememberMe: true,
    });

    component['onSubmit']();
    tick();

    expect(authService.login).toHaveBeenCalledWith({
      identifier: 'staff@eyewa.com',
      password: 'demo1234',
      rememberMe: true,
    });
  }));

  it('should show error message when login fails', fakeAsync(() => {
    authService.login.and.returnValue(
      Promise.reject(
        new LoginError(
          LoginErrorCode.InvalidCredentials,
          'Invalid username or password. Please try again.',
        ),
      ),
    );

    component['form'].setValue({
      identifier: 'bad@user.com',
      password: 'wrong',
      rememberMe: false,
    });

    component['onSubmit']();
    tick();

    expect(component['errorMessage']()).toContain('Invalid username or password');
  }));
});
