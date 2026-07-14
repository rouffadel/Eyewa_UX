import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AppConfigService } from '../../../services/app-config.service';
import { AuthService } from '../../auth/services/auth.service';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { ReportsPageComponent } from './reports-page.component';

describe('ReportsPageComponent', () => {
  let fixture: ComponentFixture<ReportsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        SellSessionStore,
        {
          provide: AppConfigService,
          useValue: { settings: { vatRate: 0.15 } },
        },
        {
          provide: AuthService,
          useValue: {
            currentSession: () => ({ displayName: 'Ameer' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();
  });

  it('should render report actions moved from payment card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('REPORTS');
    expect(compiled.textContent).toContain('PAY & PRINT');
    expect(compiled.textContent).toContain('Daily report');
    expect(compiled.textContent).toContain('Open register');
    expect(compiled.textContent).toContain('F9 Pay & Print');
  });

  it('should run register action from reports page', () => {
    const store = TestBed.inject(SellSessionStore);
    fixture.componentInstance['onAction']({ key: 'daily-report', label: 'Daily report' });
    expect(store.statusMessage()).toContain('Daily report');
  });
});
