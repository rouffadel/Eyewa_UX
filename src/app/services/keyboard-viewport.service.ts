import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

const LEGACY_FOCUSABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Android 9–10 (adjustPan): only toggle keyboard-open for CSS — no --app-height math.
 * Android 11+ / iOS: Capacitor + adjustResize as usual.
 */
@Injectable({ providedIn: 'root' })
export class KeyboardViewportService {
  private readonly platformId = inject(PLATFORM_ID);
  private initialized = false;
  private legacyAndroidKb = false;
  private focusOutTimer?: ReturnType<typeof setTimeout>;

  async init(): Promise<void> {
    if (this.initialized || !isPlatformBrowser(this.platformId) || !Capacitor.isNativePlatform()) {
      return;
    }

    this.initialized = true;
    this.legacyAndroidKb = isLegacyAndroidWebView();
    const root = document.documentElement;

    if (this.legacyAndroidKb) {
      root.classList.add('android-legacy-kb');
      document.addEventListener('focusin', this.onLegacyFocusIn, true);
      document.addEventListener('focusout', this.onLegacyFocusOut, true);
    }

    try {
      if (Capacitor.getPlatform() === 'ios') {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        await Keyboard.setScroll({ isDisabled: true });
      }

      if (!this.legacyAndroidKb) {
        await Keyboard.addListener('keyboardWillShow', () => root.classList.add('keyboard-open'));
        await Keyboard.addListener('keyboardWillHide', () => root.classList.remove('keyboard-open'));
      }
    } catch (error) {
      console.warn('Capacitor Keyboard setup failed', error);
    }
  }

  private readonly onLegacyFocusIn = (event: FocusEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !LEGACY_FOCUSABLE.has(target.tagName)) {
      return;
    }
    document.documentElement.classList.add('keyboard-open');
  };

  private readonly onLegacyFocusOut = () => {
    clearTimeout(this.focusOutTimer);
    this.focusOutTimer = window.setTimeout(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && LEGACY_FOCUSABLE.has(active.tagName)) {
        return;
      }
      document.documentElement.classList.remove('keyboard-open');
    }, 200);
  };
}

function isLegacyAndroidWebView(): boolean {
  if (Capacitor.getPlatform() !== 'android') {
    return false;
  }
  const match = navigator.userAgent.match(/Android\s+(\d+)/);
  const version = match ? Number.parseInt(match[1], 10) : 0;
  return version >= 9 && version <= 10;
}
