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
    this.statusMessage.set('');
    window.print();
  }

  protected async onDownload(): Promise<void> {
    const data = this.invoice();
    if (!data) return;

    const receiptEl = document.querySelector('.nb-receipt') as HTMLElement;
    if (!receiptEl) return;

    const invoiceNo = data.invoiceNo || 'Receipt';
    this.statusMessage.set('Preparing PDF download...');

    // Create clean container positioned at top-left to render exact 15cm x 15cm content
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '15cm';
    container.style.height = '15cm';
    container.style.zIndex = '99999';
    container.style.background = '#ffffff';
    container.style.overflow = 'hidden';

    const clone = receiptEl.cloneNode(true) as HTMLElement;
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.width = '15cm';
    clone.style.height = '15cm';

    container.appendChild(clone);
    document.body.appendChild(container);

    try {
      if (!(window as any).html2pdf) {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      }

      const options = {
        margin: [0.5, 0.5, 0.5, 0.5], // Equal 0.5cm margin on Top, Right, Bottom, Left
        filename: `Invoice_${invoiceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'cm', format: [16, 16], orientation: 'portrait' }
      };

      await (window as any).html2pdf().set(options).from(clone).save();
      this.statusMessage.set(`Invoice ${invoiceNo}.pdf downloaded successfully.`);
    } catch {
      window.print();
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF script'));
      document.body.appendChild(script);
    });
  }
}
