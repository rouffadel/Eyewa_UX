import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { ProfilePageComponent } from './profile-page.component';

describe('ProfilePageComponent', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentSession: () => ({
              displayName: 'Ameer',
              accessToken: 'mock-token',
              user: {
                loginId: 0,
                loginName: 'AMEER',
                roleId: 1,
                storeId: 0,
                permissions: { view: true, add: true, edit: true, delete: true },
                status: '200',
                message: 'Success',
                qrcodeImg: null,
              },
              branchName: 'Main Branch',
              loyaltyPoints: 250,
            }),
            user: () => ({
              loginId: 0,
              loginName: 'AMEER',
              roleId: 1,
              storeId: 0,
              permissions: { view: true, add: true, edit: true, delete: true },
              status: '200',
              message: 'Success',
              qrcodeImg: null,
            }),
            selectedStore: () => null,
            hasPermission: () => true,
            logout: jasmine.createSpy('logout'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render profile details and sign out', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('AMEER');
    expect(compiled.textContent).toContain('Main Branch');
    expect(compiled.textContent).toContain('250 PTS');
    expect(compiled.textContent).toContain('Sign out');
  });

  it('should not render customer search or new customer on profile page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input[type="search"]')).toBeNull();
    expect(compiled.textContent).not.toContain('New Customer');
  });

  it('should not render bottom navigation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bottom-nav')).toBeNull();
  });
});
