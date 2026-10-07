import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Impure so pipe updates dynamically when signal changes
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, any>): string {
    return this.translationService.translate(key, params);
  }
}
