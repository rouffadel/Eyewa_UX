import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
  let fixture: ComponentFixture<BottomNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNavComponent);
    fixture.componentRef.setInput('activeTab', 'sell');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should apply active class only to the current tab', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const activeItems = compiled.querySelectorAll('.bottom-nav__item--active');
    expect(activeItems.length).toBe(1);
    expect(activeItems[0].textContent).toContain('Sell');
  });

  it('should emit tabChange when another tab is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    let selectedTab: string | undefined;

    fixture.componentInstance.tabChange.subscribe((tab) => {
      selectedTab = tab;
    });

    const buttons = compiled.querySelectorAll<HTMLButtonElement>('.bottom-nav__item');
    buttons[1].click();
    expect(selectedTab).toBe('prescription');
  });
});
