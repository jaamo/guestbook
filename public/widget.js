(function() {
  'use strict';

  const API_URL = window.location.origin.replace(/:\d+$/, ':3000') || 'http://localhost:3000';
  
  class GuestbookWidget {
    constructor(containerId, options = {}) {
      this.containerId = containerId || 'guestbook-widget';
      this.options = {
        apiUrl: options.apiUrl || API_URL,
        theme: options.theme || 'light',
        ...options
      };
      this.init();
    }

    async init() {
      const container = document.getElementById(this.containerId);
      if (!container) {
        console.error(`Container with id "${this.containerId}" not found`);
        return;
      }

      this.render(container);
      await this.loadEntries();
    }

    render(container) {
      container.innerHTML = `
        <div class="gb-widget gb-theme-${this.options.theme}">
          <div class="gb-header">
            <h3>Guestbook</h3>
          </div>
          <div class="gb-form">
            <input type="text" id="gb-name" placeholder="Your Name" required>
            <input type="email" id="gb-email" placeholder="Your Email (optional)">
            <input type="url" id="gb-website" placeholder="Your Website (optional)">
            <textarea id="gb-message" placeholder="Your Message" required></textarea>
            <button id="gb-submit">Submit</button>
          </div>
          <div class="gb-entries" id="gb-entries">
            <div class="gb-loading">Loading entries...</div>
          </div>
        </div>
      `;

      this.injectStyles();
      this.attachEvents();
    }

    injectStyles() {
      if (document.getElementById('gb-widget-styles')) return;

      const style = document.createElement('style');
      style.id = 'gb-widget-styles';
      style.textContent = `
        .gb-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .gb-theme-dark {
          background: #1a1a1a;
          color: #fff;
          border-color: #333;
        }
        .gb-theme-light {
          background: #fff;
          color: #333;
        }
        .gb-header h3 {
          margin: 0 0 20px 0;
          font-size: 24px;
        }
        .gb-form {
          margin-bottom: 30px;
        }
        .gb-form input,
        .gb-form textarea {
          width: 100%;
          padding: 10px;
          margin-bottom: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .gb-theme-dark .gb-form input,
        .gb-theme-dark .gb-form textarea {
          background: #2a2a2a;
          color: #fff;
          border-color: #444;
        }
        .gb-form textarea {
          min-height: 100px;
          resize: vertical;
        }
        .gb-form button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .gb-form button:hover {
          background: #0056b3;
        }
        .gb-form button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .gb-entries {
          margin-top: 20px;
        }
        .gb-entry {
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: #f9f9f9;
        }
        .gb-theme-dark .gb-entry {
          background: #2a2a2a;
          border-color: #444;
        }
        .gb-entry-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .gb-entry-name {
          color: #007bff;
        }
        .gb-theme-dark .gb-entry-name {
          color: #4da3ff;
        }
        .gb-entry-date {
          font-size: 12px;
          color: #666;
        }
        .gb-theme-dark .gb-entry-date {
          color: #aaa;
        }
        .gb-entry-message {
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .gb-entry-website {
          margin-top: 5px;
          font-size: 12px;
        }
        .gb-entry-website a {
          color: #007bff;
          text-decoration: none;
        }
        .gb-theme-dark .gb-entry-website a {
          color: #4da3ff;
        }
        .gb-loading,
        .gb-error,
        .gb-empty {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        .gb-theme-dark .gb-loading,
        .gb-theme-dark .gb-error,
        .gb-theme-dark .gb-empty {
          color: #aaa;
        }
        .gb-success {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        .gb-theme-dark .gb-success {
          background: #1e4620;
          color: #90ee90;
        }
      `;
      document.head.appendChild(style);
    }

    attachEvents() {
      const submitBtn = document.getElementById('gb-submit');
      submitBtn?.addEventListener('click', () => this.submitEntry());
    }

    async loadEntries() {
      const entriesContainer = document.getElementById('gb-entries');
      if (!entriesContainer) return;

      try {
        const response = await fetch(`${this.options.apiUrl}/api/guestbook`);
        const entries = await response.json();

        if (entries.length === 0) {
          entriesContainer.innerHTML = '<div class="gb-empty">No entries yet. Be the first to leave a message!</div>';
          return;
        }

        entriesContainer.innerHTML = entries.map(entry => this.renderEntry(entry)).join('');
      } catch (error) {
        entriesContainer.innerHTML = '<div class="gb-error">Failed to load entries. Please try again later.</div>';
        console.error('Error loading entries:', error);
      }
    }

    renderEntry(entry) {
      const date = new Date(entry.created_at).toLocaleDateString();
      const website = entry.website ? `<div class="gb-entry-website"><a href="${entry.website}" target="_blank" rel="noopener">${entry.website}</a></div>` : '';
      
      return `
        <div class="gb-entry">
          <div class="gb-entry-header">
            <span class="gb-entry-name">${this.escapeHtml(entry.name)}</span>
            <span class="gb-entry-date">${date}</span>
          </div>
          <div class="gb-entry-message">${this.escapeHtml(entry.message)}</div>
          ${website}
        </div>
      `;
    }

    async submitEntry() {
      const nameInput = document.getElementById('gb-name');
      const emailInput = document.getElementById('gb-email');
      const websiteInput = document.getElementById('gb-website');
      const messageInput = document.getElementById('gb-message');
      const submitBtn = document.getElementById('gb-submit');
      const entriesContainer = document.getElementById('gb-entries');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const website = websiteInput.value.trim();
      const message = messageInput.value.trim();

      if (!name || !message) {
        alert('Please fill in your name and message');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const response = await fetch(`${this.options.apiUrl}/api/guestbook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, website, message }),
        });

        if (response.ok) {
          const successMsg = document.createElement('div');
          successMsg.className = 'gb-success';
          successMsg.textContent = 'Thank you! Your entry has been submitted and will be reviewed.';
          entriesContainer?.parentElement?.insertBefore(successMsg, entriesContainer);

          // Clear form
          nameInput.value = '';
          emailInput.value = '';
          websiteInput.value = '';
          messageInput.value = '';

          setTimeout(() => successMsg.remove(), 5000);
        } else {
          alert('Failed to submit entry. Please try again.');
        }
      } catch (error) {
        alert('An error occurred. Please try again.');
        console.error('Error submitting entry:', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Auto-initialize if container exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('guestbook-widget');
      if (container) {
        new GuestbookWidget('guestbook-widget');
      }
    });
  } else {
    const container = document.getElementById('guestbook-widget');
    if (container) {
      new GuestbookWidget('guestbook-widget');
    }
  }

  // Export for manual initialization
  if (typeof window !== 'undefined') {
    window.GuestbookWidget = GuestbookWidget;
  }
})();

