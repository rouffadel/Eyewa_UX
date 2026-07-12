import { Component, input, output } from '@angular/core';
import { PrescriptionSummary } from '../models/customer.models';

@Component({
  selector: 'app-latest-prescription-summary',
  templateUrl: './latest-prescription-summary.component.html',
  styleUrl: './latest-prescription-summary.component.css',
  host: { class: 'latest-prescription-summary-host' },
})
export class LatestPrescriptionSummaryComponent {
  readonly summary = input<PrescriptionSummary | null>(null);
  readonly hasCustomer = input(true);
  readonly loading = input(false);

  readonly viewPrescription = output<void>();
  readonly viewHistory = output<void>();
  readonly newPrescription = output<void>();
}
