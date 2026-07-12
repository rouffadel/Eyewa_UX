import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-face-measurement-diagram',
  templateUrl: './face-measurement-diagram.component.html',
  styleUrl: './face-measurement-diagram.component.css',
})
export class FaceMeasurementDiagramComponent {
  readonly pd = input<number | null>(null);
  readonly frameWidth = input<number | null>(null);
  readonly lensHeight = input<number | null>(null);

  protected readonly pdLabel = computed(() => this.formatValue(this.pd()));
  protected readonly frameWidthLabel = computed(() => this.formatValue(this.frameWidth()));
  protected readonly lensHeightLabel = computed(() => this.formatValue(this.lensHeight()));

  private formatValue(value: number | null): string {
    if (value === null || Number.isNaN(value)) {
      return '—';
    }

    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }
}
