
export type SweetIcon = 'success' | 'error' | 'warning' | 'info' | 'question' | 'loading';

export interface SweetOptions {
    title?: string;
    text?: string;
    icon?: SweetIcon;
    showCancelButton?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
    footer?: string;
    width?: string;
    padding?: string;
    background?: string;
    backdrop?: string | boolean;
    timer?: number;
    timerProgressBar?: boolean;
    toast?: boolean;
    position?: 'top' | 'top-start' | 'top-end' | 'center' | 'center-start' | 'center-end' | 'bottom' | 'bottom-start' | 'bottom-end';
    allowOutsideClick?: boolean;
    showConfirmButton?: boolean;
    customClass?: {
        container?: string;
        popup?: string;
        header?: string;
        title?: string;
        closeButton?: string;
        icon?: string;
        image?: string;
        htmlContainer?: string;
        input?: string;
        inputLabel?: string;
        validationMessage?: string;
        actions?: string;
        confirmButton?: string;
        denyButton?: string;
        cancelButton?: string;
        loader?: string;
        footer?: string;
        timerProgressBar?: string;
    };
}

export interface SweetResult {
    isConfirmed: boolean;
    isDenied: boolean;
    isDismissed: boolean;
    value?: any;
    dismiss?: 'cancel' | 'backdrop' | 'esc' | 'timer';
}

/**
 * Advanced Sweet Alert implementation for ArikaJS.
 * Features: Modals, Toasts, Stacking, Promises, Glassmorphism.
 */
export class Sweet {
    private static _instance: Sweet;
    private _queue: SweetOptions[] = [];
    private _activePopups: HTMLElement[] = [];
    private _initialized = false;

    constructor() {
        if (typeof window !== 'undefined' && !this._initialized) {
            this._injectStyles();
            this._initialized = true;
        }
    }

    /**
     * Singleton instance.
     */
    public static getInstance(): Sweet {
        if (!Sweet._instance) {
            Sweet._instance = new Sweet();
        }
        return Sweet._instance;
    }

    /**
     * Fire a new alert.
     */
    public async fire(titleOrOptions: string | SweetOptions, text?: string, icon?: SweetIcon): Promise<SweetResult> {
        let options: SweetOptions = {};

        if (typeof titleOrOptions === 'string') {
            options = { title: titleOrOptions, text, icon };
        } else {
            options = titleOrOptions;
        }

        return this._show(options);
    }

    /** Shortcuts */
    public success(title: string, text?: string) { return this.fire(title, text, 'success'); }
    public error(title: string, text?: string) { return this.fire(title, text, 'error'); }
    public warning(title: string, text?: string) { return this.fire(title, text, 'warning'); }
    public info(title: string, text?: string) { return this.fire(title, text, 'info'); }
    public question(title: string, text?: string) { return this.fire(title, text, 'question'); }

    /**
     * Confirmation dialog.
     */
    public async confirm(title: string, text?: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> {
        const result = await this.fire({
            title,
            text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText
        });
        return result.isConfirmed;
    }

    /**
     * Show a toast notification.
     */
    public toast(title: string, icon: SweetIcon = 'info', timer = 3000) {
        return this.fire({
            title,
            icon,
            toast: true,
            position: 'top-end',
            timer,
            showConfirmButton: false,
            timerProgressBar: true
        });
    }

    /**
     * ADVANCED: Handle a Promise with loading/success/error states.
     */
    public async promise<T>(
        promise: Promise<T>,
        messages: { loading: string; success: string | ((res: T) => string); error: string | ((err: any) => string) }
    ): Promise<T> {
        const loadingPopup = await this.fire({
            title: messages.loading,
            icon: 'loading',
            showConfirmButton: false,
            allowOutsideClick: false
        });

        try {
            const result = await promise;
            const successMsg = typeof messages.success === 'function' ? messages.success(result) : messages.success;
            
            // Close loading and show success
            this.close();
            this.fire(successMsg, undefined, 'success');
            
            return result;
        } catch (err) {
            const errorMsg = typeof messages.error === 'function' ? messages.error(err) : messages.error;
            
            // Close loading and show error
            this.close();
            this.fire(errorMsg, undefined, 'error');
            
            throw err;
        }
    }

    /**
     * Close the most recent popup.
     */
    public close() {
        const popup = this._activePopups.pop();
        if (popup) {
            popup.classList.add('arika-sweet-hide');
            setTimeout(() => {
                popup.remove();
                if (this._activePopups.length === 0) {
                    const container = document.querySelector('.arika-sweet-container');
                    if (container) container.remove();
                }
            }, 200);
        }
    }

    /**
     * Internal: Render and show the popup.
     */
    private _show(options: SweetOptions): Promise<SweetResult> {
        return new Promise((resolve) => {
            const container = this._getOrCreateContainer(options);
            const popup = document.createElement('div');
            popup.className = `arika-sweet-popup ${options.toast ? 'arika-sweet-toast' : ''} arika-sweet-show`;
            if (options.icon) popup.classList.add(`arika-sweet-icon-${options.icon}`);

            // Apply glassmorphism and custom styles
            if (options.background) popup.style.background = options.background;
            if (options.width) popup.style.width = options.width;
            if (options.padding) popup.style.padding = options.padding;

            const iconHtml = this._getIconHtml(options.icon);
            const titleHtml = options.title ? `<h2 class="arika-sweet-title">${options.title}</h2>` : '';
            const textHtml = options.text ? `<div class="arika-sweet-text">${options.text}</div>` : '';
            
            let buttonsHtml = '';
            if (options.showConfirmButton !== false) {
                buttonsHtml += `<button class="arika-sweet-btn arika-sweet-confirm">${options.confirmButtonText || 'OK'}</button>`;
            }
            if (options.showCancelButton) {
                buttonsHtml += `<button class="arika-sweet-btn arika-sweet-cancel">${options.cancelButtonText || 'Cancel'}</button>`;
            }

            popup.innerHTML = `
                <div class="arika-sweet-content">
                    ${iconHtml}
                    <div class="arika-sweet-header">
                        ${titleHtml}
                        ${textHtml}
                    </div>
                </div>
                ${buttonsHtml ? `<div class="arika-sweet-actions">${buttonsHtml}</div>` : ''}
                ${options.timerProgressBar ? `<div class="arika-sweet-timer-progress"></div>` : ''}
            `;

            container.appendChild(popup);
            this._activePopups.push(popup);

            // Event Handlers
            const confirmBtn = popup.querySelector('.arika-sweet-confirm');
            const cancelBtn = popup.querySelector('.arika-sweet-cancel');

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.close();
                    resolve({ isConfirmed: true, isDenied: false, isDismissed: false });
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.close();
                    resolve({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: 'cancel' });
                });
            }

            // Outside click handler
            if (options.allowOutsideClick !== false && !options.toast) {
                container.addEventListener('click', (e) => {
                    if (e.target === container) {
                        this.close();
                        resolve({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: 'backdrop' });
                    }
                });
            }

            // Timer handler
            if (options.timer) {
                if (options.timerProgressBar) {
                    const progressBar = popup.querySelector('.arika-sweet-timer-progress') as HTMLElement;
                    if (progressBar) {
                        progressBar.style.transition = `width ${options.timer}ms linear`;
                        setTimeout(() => progressBar.style.width = '0%', 10);
                    }
                }
                setTimeout(() => {
                    this.close();
                    resolve({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: 'timer' });
                }, options.timer);
            }
        });
    }

    private _getOrCreateContainer(options: SweetOptions): HTMLElement {
        let container = document.querySelector('.arika-sweet-container') as HTMLElement;
        if (!container) {
            container = document.createElement('div');
            container.className = `arika-sweet-container arika-sweet-position-${options.position || 'center'}`;
            if (options.backdrop !== false && !options.toast) {
                container.style.background = typeof options.backdrop === 'string' ? options.backdrop : 'rgba(0, 0, 0, 0.4)';
                container.style.backdropFilter = 'blur(4px)';
            }
            document.body.appendChild(container);
        }
        return container;
    }

    private _getIconHtml(icon?: SweetIcon): string {
        if (!icon) return '';
        if (icon === 'loading') {
            return `<div class="arika-sweet-icon-wrapper"><div class="arika-sweet-loader"></div></div>`;
        }
        
        let svg = '';
        switch(icon) {
            case 'success':
                svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
                break;
            case 'error':
                svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
                break;
            case 'info':
                svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
                break;
            case 'warning':
                svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
                break;
            case 'question':
                svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
                break;
        }
        return `<div class="arika-sweet-icon-wrapper">${svg}</div>`;
    }

    private _injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .arika-sweet-container {
                position: fixed;
                inset: 0;
                display: flex;
                z-index: 99999;
                padding: 1rem;
                pointer-events: none;
            }
            .arika-sweet-container:not(.arika-sweet-position-top-end) {
                justify-content: center;
                align-items: center;
            }
            .arika-sweet-position-top-end { justify-content: flex-end; align-items: flex-start; }
            .arika-sweet-position-top { justify-content: center; align-items: flex-start; }
            .arika-sweet-position-bottom { justify-content: center; align-items: flex-end; }
            
            .arika-sweet-container * { pointer-events: auto; }
            
            .arika-sweet-popup {
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 1.25rem;
                padding: 2rem;
                width: 100%;
                max-width: 450px;
                box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15);
                font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s;
                transform: scale(0.9) translateY(20px);
                opacity: 0;
            }
            .arika-sweet-show { transform: scale(1) translateY(0); opacity: 1; }
            .arika-sweet-hide { transform: scale(0.95); opacity: 0; }
            
            .arika-sweet-toast {
                max-width: 320px;
                padding: 1.25rem;
                margin: 1rem;
                border-radius: 1rem;
            }
            
            .arika-sweet-content { display: flex; flex-direction: column; align-items: center; text-align: center; }
            .arika-sweet-toast .arika-sweet-content { flex-direction: row; text-align: left; align-items: flex-start; gap: 0.75rem; }
            
            .arika-sweet-icon-wrapper { width: 60px; height: 60px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
            .arika-sweet-toast .arika-sweet-icon-wrapper { width: 24px; height: 24px; margin-bottom: 0; flex-shrink: 0; }
            
            .arika-sweet-icon-success .arika-sweet-icon-wrapper { color: #10b981; background: #ecfdf5; }
            .arika-sweet-icon-error .arika-sweet-icon-wrapper { color: #ef4444; background: #fef2f2; }
            .arika-sweet-icon-info .arika-sweet-icon-wrapper { color: #3b82f6; background: #eff6ff; }
            .arika-sweet-icon-warning .arika-sweet-icon-wrapper { color: #f59e0b; background: #fffbeb; }
            .arika-sweet-icon-question .arika-sweet-icon-wrapper { color: #6366f1; background: #eef2ff; }
            
            .arika-sweet-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 0.75rem 0; line-height: 1.2; }
            .arika-sweet-toast .arika-sweet-title { font-size: 0.9375rem; margin-bottom: 0.25rem; }
            
            .arika-sweet-text { font-size: 1rem; color: #64748b; line-height: 1.6; }
            .arika-sweet-toast .arika-sweet-text { font-size: 0.8125rem; }
            
            .arika-sweet-actions { display: flex; justify-content: center; gap: 0.75rem; margin-top: 2rem; }
            .arika-sweet-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 0.75rem;
                font-weight: 600;
                font-size: 0.9375rem;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }
            .arika-sweet-confirm { background: #6366f1; color: white; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4); }
            .arika-sweet-confirm:hover { background: #4f46e5; transform: translateY(-1px); }
            .arika-sweet-cancel { background: #f1f5f9; color: #475569; }
            .arika-sweet-cancel:hover { background: #e2e8f0; }

            .arika-sweet-loader {
                width: 32px;
                height: 32px;
                border: 3px solid #6366f122;
                border-top-color: #6366f1;
                border-radius: 50%;
                animation: arika-spin 0.8s linear infinite;
            }
            @keyframes arika-spin { to { transform: rotate(360deg); } }

            .arika-sweet-timer-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 4px;
                background: #6366f133;
                width: 100%;
                border-bottom-left-radius: 1.25rem;
                border-bottom-right-radius: 1.25rem;
            }
        `;
        document.head.appendChild(style);
    }
}

export const sweet = Sweet.getInstance();

// Expose to window for traditional script usage
if (typeof window !== 'undefined') {
    (window as any).sweet = sweet;
}
