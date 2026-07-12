import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SellSessionStore } from '../sell/services/sell-session.store';

@Component({
  selector: 'app-prescription-history',
  templateUrl: './prescription-history.component.html',
  styleUrl: './prescription-history.component.css',
})
export class PrescriptionHistoryComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly store = inject(SellSessionStore);

  protected readonly selectedCustomer = computed(() => this.store.selectedCustomer());
  protected readonly history = computed(() => this.store.prescriptionHistory());
  protected readonly loading = computed(() => this.store.prescriptionLoading());
  protected readonly selectedId = signal<string | null>(null);

  ngOnInit(): void {
    this.store.ensureSalesDetailsLoaded();

    const customer = this.store.selectedCustomer();
    if (customer?.id) {
      this.store.loadSelectedPrescription(customer.id);
    }
  }

  constructor() {
    effect(() => {
      const history = this.history();
      const currentSelection = this.selectedId();
      const storeSelection = this.store.selectedPrescriptionId();

      if (history.length === 0) {
        this.selectedId.set(null);
        return;
      }

      if (currentSelection && history.some((entry) => entry.id === currentSelection)) {
        return;
      }

      if (storeSelection && history.some((entry) => entry.id === storeSelection)) {
        this.selectedId.set(storeSelection);
        return;
      }

      this.selectedId.set(history[0]?.id ?? null);
    });
  }

  protected onSelect(prescriptionId: string): void {
    this.selectedId.set(prescriptionId);
    this.store.selectPrescriptionFromHistory(prescriptionId);
  }

  protected onViewSelected(): void {
    const prescriptionId = this.selectedId();
    if (!prescriptionId) {
      return;
    }

    this.store.selectPrescriptionFromHistory(prescriptionId);
    void this.router.navigate(['/home/sell']);
  }

  protected onBackToSell(): void {
    void this.router.navigate(['/home/sell']);
  }

  protected onNewPrescription(): void {
    void this.router.navigate(['/home/prescription']);
  }
}
