import { Injectable, signal, computed } from '@angular/core';
import { Title } from '@angular/platform-browser';

export type AnnouncementPriority = 'polite' | 'assertive';

interface Announcement {
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private announcementState = signal<Announcement | null>(null);
  
  // Public signals for the UI to consume
  currentAnnouncement = computed(() => this.announcementState()?.message || '');
  currentPriority = computed(() => this.announcementState()?.priority || 'polite');

  constructor(private titleService: Title) {}

  /**
   * Sends a message to screen readers via an ARIA live region.
   */
  announce(message: string, priority: AnnouncementPriority = 'polite') {
    // We update the state with a new timestamp to ensure Angular detects a change
    // even if the message is the same as the previous one.
    this.announcementState.set({ message, priority, timestamp: Date.now() });
    
    // Clear the message after a short delay so it doesn't stay in the DOM
    // but give enough time for the screen reader to grab it.
    setTimeout(() => {
      if (this.announcementState()?.message === message) {
        this.announcementState.set(null);
      }
    }, 3000);
  }

  /**
   * Sets the page title and announces it to screen readers.
   */
  setPageTitle(title: string) {
    const fullTitle = `${title} | Panel IPA 2026`;
    this.titleService.setTitle(fullTitle);
    this.announce(`Navegando a ${title}`, 'polite');
  }

  /**
   * Focuses an element by CSS selector. Useful after routing.
   */
  focusElement(selector: string) {
    // Small timeout to ensure DOM is ready after navigation
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.tabIndex = -1; // Ensure it's focusable if it's not a button/input
        element.focus();
        // Remove tabindex if it wasn't there before to keep HTML clean (optional)
        element.addEventListener('blur', () => {
           if (element.getAttribute('tabindex') === '-1') {
             // element.removeAttribute('tabindex');
           }
        }, { once: true });
      }
    }, 100);
  }

  /**
   * Helper to handle Space or Enter key events for custom interactive elements.
   */
  handleKeyboardClick(event: KeyboardEvent, callback: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
}
