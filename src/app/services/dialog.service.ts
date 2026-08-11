import { Injectable } from '@angular/core';

export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  confirm(options: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.background = 'rgba(15, 23, 42, 0.4)';
      overlay.style.backdropFilter = 'blur(12px)';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.25s ease';

      const modal = document.createElement('div');
      modal.style.background = '#ffffff';
      modal.style.borderRadius = '20px';
      modal.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
      modal.style.width = '90%';
      modal.style.maxWidth = '420px';
      modal.style.padding = '32px';
      modal.style.border = '1px solid rgba(241, 245, 249, 1)';
      modal.style.transform = 'scale(0.9) translateY(20px)';
      modal.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      modal.style.fontFamily = 'Inter, system-ui, sans-serif';

      const title = document.createElement('h3');
      title.textContent = options.title ?? 'Confirm Action';
      title.style.margin = '0 0 12px 0';
      title.style.fontSize = '20px';
      title.style.fontWeight = '700';
      title.style.color = '#0f172a';

      const message = document.createElement('p');
      message.textContent = options.message;
      message.style.margin = '0 0 28px 0';
      message.style.fontSize = '15px';
      message.style.lineHeight = '1.6';
      message.style.color = '#475569';

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'flex-end';
      actions.style.gap = '12px';

      const cancelButton = document.createElement('button');
      cancelButton.textContent = options.cancelText ?? 'Cancel';
      cancelButton.style.padding = '12px 20px';
      cancelButton.style.borderRadius = '12px';
      cancelButton.style.border = '1px solid #e2e8f0';
      cancelButton.style.background = '#ffffff';
      cancelButton.style.color = '#475569';
      cancelButton.style.fontSize = '14px';
      cancelButton.style.fontWeight = '600';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.transition = 'background 0.2s';
      cancelButton.onmouseover = () => { cancelButton.style.background = '#f8fafc'; };
      cancelButton.onmouseout = () => { cancelButton.style.background = '#ffffff'; };

      const confirmButton = document.createElement('button');
      confirmButton.textContent = options.confirmText ?? 'Confirm';
      confirmButton.style.padding = '12px 20px';
      confirmButton.style.borderRadius = '12px';
      confirmButton.style.border = 'none';
      confirmButton.style.background = options.isDestructive ? '#ef4444' : '#6366f1';
      confirmButton.style.color = '#ffffff';
      confirmButton.style.fontSize = '14px';
      confirmButton.style.fontWeight = '600';
      confirmButton.style.cursor = 'pointer';
      confirmButton.style.transition = 'background 0.2s';
      confirmButton.onmouseover = () => { confirmButton.style.background = options.isDestructive ? '#dc2626' : '#4f46e5'; };
      confirmButton.onmouseout = () => { confirmButton.style.background = options.isDestructive ? '#ef4444' : '#6366f1'; };

      const closeDialog = (result: boolean) => {
        modal.style.transform = 'scale(0.9) translateY(20px)';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 250);
      };

      cancelButton.addEventListener('click', () => closeDialog(false));
      confirmButton.addEventListener('click', () => closeDialog(true));

      actions.appendChild(cancelButton);
      actions.appendChild(confirmButton);
      modal.appendChild(title);
      modal.appendChild(message);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Trigger animation
      setTimeout(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1) translateY(0)';
      }, 10);
    });
  }
}
