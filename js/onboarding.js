/**
 * Onboarding / Walkthrough Screen Controller (FR-01)
 * Displays swipeable 3-step walkthrough slides for first-time users.
 */

import { Storage } from './storage.js';

export const Onboarding = {
  currentSlide: 0,
  totalSlides: 3,

  init(onCompleteCallback) {
    this.overlayEl = document.getElementById('onboardingOverlay');
    this.trackEl = document.getElementById('slidesTrack');
    this.nextBtn = document.getElementById('onboardingNextBtn');
    this.skipBtn = document.getElementById('onboardingSkipBtn');
    this.dots = document.querySelectorAll('.pagination-dots .dot');
    this.onCompleteCallback = onCompleteCallback;

    if (!this.overlayEl || !this.trackEl) return;

    // Check if onboarding is already completed
    if (Storage.isOnboardingCompleted()) {
      this.hide();
    } else {
      this.show();
    }

    this.bindEvents();
  },

  show() {
    this.currentSlide = 0;
    this.updateSlidePosition();
    this.overlayEl.classList.remove('hidden');
  },

  hide() {
    this.overlayEl.classList.add('hidden');
    Storage.setOnboardingCompleted(true);
    if (this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  },

  next() {
    if (this.currentSlide < this.totalSlides - 1) {
      this.currentSlide++;
      this.updateSlidePosition();
    } else {
      this.hide();
    }
  },

  updateSlidePosition() {
    const offset = -(this.currentSlide * (100 / this.totalSlides));
    this.trackEl.style.transform = `translateX(${offset}%)`;

    // Update dots
    this.dots.forEach((dot, idx) => {
      if (idx === this.currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Update Next button label on final slide
    if (this.currentSlide === this.totalSlides - 1) {
      this.nextBtn.textContent = 'Get Started';
      this.nextBtn.classList.add('primary');
    } else {
      this.nextBtn.textContent = 'Next';
    }
  },

  bindEvents() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.hide());
    }

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    this.trackEl.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.trackEl.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchStartX - touchEndX;
      if (swipeDistance > 40) {
        // Swiped left -> next slide
        this.next();
      } else if (swipeDistance < -40 && this.currentSlide > 0) {
        // Swiped right -> previous slide
        this.currentSlide--;
        this.updateSlidePosition();
      }
    }, { passive: true });
  }
};
