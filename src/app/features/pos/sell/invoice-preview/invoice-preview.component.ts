import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SellSessionStore } from '../services/sell-session.store';

@Component({
  selector: 'app-invoice-preview',
  templateUrl: './invoice-preview.component.html',
  styleUrl: './invoice-preview.component.css',
})
export class InvoicePreviewComponent {
  private readonly router = inject(Router);
  private readonly store = inject(SellSessionStore);

  protected readonly invoice = computed(() => this.store.lastInvoice());
  protected readonly statusMessage = signal('');

  protected onCancel(): void {
    void this.router.navigate(['/home/sell']);
  }

  protected onPrint(): void {
    this.statusMessage.set('Receipt print is not connected yet.');
  }
}
