import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  show(message: string, duration = 3000): void {
    let container = document.getElementById('global-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'global-toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '24px';
      container.style.right = '24px';
      container.style.zIndex = '99999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '12px';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    
    // Inject premium styles inline/via stylesheet
    toast.style.background = 'rgba(30, 41, 59, 0.9)';
    toast.style.backdropFilter = 'blur(8px)';
    toast.style.color = '#ffffff';
    toast.style.padding = '14px 24px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    toast.style.fontFamily = 'Inter, system-ui, sans-serif';
    toast.style.minWidth = '280px';
    toast.style.maxWidth = '400px';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.style.pointerEvents = 'auto';

    container.appendChild(toast);

    // Trigger entrance animation
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    // Auto-remove after duration
    setTimeout(() => {
      toast.style.transform = 'translateY(-20px)';
      toast.style.opacity = '0';
      toast.style.filter = 'blur(4px)';
      setTimeout(() => {
        toast.remove();
        if (container && container.childElementCount === 0) {
          container.remove();
        }
      }, 400);
    }, duration);
  }
}
