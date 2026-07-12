import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pos-tab-placeholder',
  imports: [],
  template: `
    <section class="tab-placeholder pos-scroll-page">
      <h1>{{ title }}</h1>
      <p>This section is coming soon. Switch tabs using the bottom navigation.</p>
    </section>
  `,
  styles: `
    .tab-placeholder {
      padding: 1rem max(1rem, env(safe-area-inset-right, 0)) 1.5rem
        max(1rem, env(safe-area-inset-left, 0));
      box-sizing: border-box;
    }

    @media (min-width: 768px), (min-width: 600px) and (min-height: 500px) {
      .tab-placeholder {
        max-width: min(960px, 100%);
        margin-inline: auto;
        padding: 1.5rem 1rem;
      }
    }

    h1 {
      margin: 0 0 0.5rem;
      font-size: clamp(1.25rem, 2.5vw, 1.5rem);
      color: var(--color-text-heading);
    }

    p {
      margin: 0;
      max-width: 36rem;
      color: var(--color-text-body);
    }
  `,
})
export class PosTabPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  protected get title(): string {
    return this.route.snapshot.data['title'] ?? 'Section';
  }
}
