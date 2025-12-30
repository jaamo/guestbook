(function () {
  "use strict";

  const API_URL =
    window.location.origin.replace(/:\d+$/, ":3000") || "http://localhost:3000";

  class GuestbookWidget {
    constructor(containerId, options = {}) {
      this.containerId = containerId || "guestbook-widget";
      this.options = {
        apiUrl: options.apiUrl || API_URL,
        ...options,
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
      // Auto-detect page title and URL
      const pageTitle = document.title || "Untitled Page";
      const pageUrl = window.location.href;

      container.innerHTML = `
        <div class="gb-widget">
          <button id="gb-show-form" class="gb-show-form-btn">Leave a Message</button>
          <div class="gb-form gb-form-hidden" id="gb-form-container">
            <input type="text" id="gb-name" placeholder="Your Name" required>
            <input type="email" id="gb-email" placeholder="Your Email (optional)">
            <input type="text" id="gb-page-title" value="Episode: ${this.escapeHtml(
              pageTitle
            )}" readonly disabled class="gb-page-title">
            <input type="hidden" id="gb-page-url" value="${this.escapeHtml(
              pageUrl
            )}">
            <textarea id="gb-message" placeholder="Your Message" required maxlength="500"></textarea>
            <div class="gb-char-count" id="gb-char-count">0 / 500 characters</div>
            <div class="gb-form-actions">
              <button id="gb-submit">Submit</button>
              <button type="button" id="gb-cancel" class="gb-cancel-btn">Cancel</button>
            </div>
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
      if (document.getElementById("gb-widget-styles")) return;

      const style = document.createElement("style");
      style.id = "gb-widget-styles";
      style.textContent = `
        .gb-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          width: 100%;
          background: #fff;
          color: #333;
          box-sizing: border-box;
        }
        .gb-form {
          margin-bottom: 30px;
        }
        .gb-form-hidden {
          display: none;
        }
        .gb-show-form-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          margin-bottom: 20px;
        }
        .gb-show-form-btn:hover {
          background: #0056b3;
        }
        .gb-form-actions {
          display: flex;
          gap: 10px;
        }
        .gb-form-actions button {
          flex: 1;
        }
        .gb-cancel-btn {
          background: #6c757d;
        }
        .gb-cancel-btn:hover {
          background: #5a6268;
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
        .gb-form input.gb-page-title {
          background: #f5f5f5;
          color: #666;
          cursor: not-allowed;
          font-style: italic;
        }
        .gb-form textarea {
          min-height: 100px;
          resize: vertical;
        }
        .gb-char-count {
          font-size: 12px;
          color: #666;
          text-align: right;
          margin-top: -5px;
          margin-bottom: 10px;
        }
        .gb-char-count.gb-char-count-warning {
          color: #ff9800;
        }
        .gb-char-count.gb-char-count-error {
          color: #dc3545;
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
        .gb-entry-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .gb-entry-name {
          color: #007bff;
        }
        .gb-entry-date {
          font-size: 12px;
          color: #666;
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
        .gb-entry-page {
          margin-bottom: 10px;
          padding: 8px 12px;
          background: #e7f3ff;
          border-left: 3px solid #007bff;
          border-radius: 4px;
          font-size: 13px;
        }
        .gb-entry-page a {
          color: #007bff;
          text-decoration: none;
          font-weight: 500;
        }
        .gb-entry-page a:hover {
          text-decoration: underline;
        }
        .gb-entry-page-icon {
          margin-right: 6px;
        }
        .gb-loading,
        .gb-error,
        .gb-empty {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        .gb-success {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
      `;
      document.head.appendChild(style);
    }

    attachEvents() {
      const submitBtn = document.getElementById("gb-submit");
      const showFormBtn = document.getElementById("gb-show-form");
      const cancelBtn = document.getElementById("gb-cancel");
      const formContainer = document.getElementById("gb-form-container");
      const messageInput = document.getElementById("gb-message");
      const charCount = document.getElementById("gb-char-count");

      submitBtn?.addEventListener("click", () => this.submitEntry());
      showFormBtn?.addEventListener("click", () => this.showForm());
      cancelBtn?.addEventListener("click", () => this.hideForm());

      // Update character counter
      messageInput?.addEventListener("input", () => this.updateCharCount());
    }

    updateCharCount() {
      const messageInput = document.getElementById("gb-message");
      const charCount = document.getElementById("gb-char-count");
      if (!messageInput || !charCount) return;

      const length = messageInput.value.length;
      const maxLength = 500;
      const remaining = maxLength - length;

      charCount.textContent = `${length} / ${maxLength} characters`;

      // Update styling based on remaining characters
      charCount.classList.remove(
        "gb-char-count-warning",
        "gb-char-count-error"
      );
      if (remaining < 50) {
        charCount.classList.add("gb-char-count-error");
      } else if (remaining < 100) {
        charCount.classList.add("gb-char-count-warning");
      }
    }

    showForm() {
      const formContainer = document.getElementById("gb-form-container");
      const showFormBtn = document.getElementById("gb-show-form");
      if (formContainer) {
        formContainer.classList.remove("gb-form-hidden");
      }
      if (showFormBtn) {
        showFormBtn.style.display = "none";
      }
      // Initialize character counter
      this.updateCharCount();
    }

    hideForm() {
      const formContainer = document.getElementById("gb-form-container");
      const showFormBtn = document.getElementById("gb-show-form");
      if (formContainer) {
        formContainer.classList.add("gb-form-hidden");
      }
      if (showFormBtn) {
        showFormBtn.style.display = "block";
      }
    }

    async loadEntries() {
      const entriesContainer = document.getElementById("gb-entries");
      if (!entriesContainer) return;

      try {
        const response = await fetch(`${this.options.apiUrl}/api/guestbook`);
        const entries = await response.json();

        if (entries.length === 0) {
          entriesContainer.innerHTML =
            '<div class="gb-empty">No entries yet. Be the first to leave a message!</div>';
          return;
        }

        entriesContainer.innerHTML = entries
          .map((entry) => this.renderEntry(entry))
          .join("");
      } catch (error) {
        entriesContainer.innerHTML =
          '<div class="gb-error">Failed to load entries. Please try again later.</div>';
        console.error("Error loading entries:", error);
      }
    }

    renderEntry(entry) {
      const date = new Date(entry.created_at).toLocaleDateString();
      const website = entry.website
        ? `<div class="gb-entry-website"><a href="${entry.website}" target="_blank" rel="noopener">${entry.website}</a></div>`
        : "";

      // Show page link if page_url exists
      let pageInfo = "";
      if (entry.page_url) {
        const pageTitle = entry.page_title || "View Post";
        const pageUrl = entry.page_url;
        pageInfo = `<div class="gb-entry-page">
          <span class="gb-entry-page-icon">🔗</span>
          <a href="${this.escapeHtml(
            pageUrl
          )}" target="_blank" rel="noopener">Episode: ${this.escapeHtml(
          pageTitle
        )}</a>
        </div>`;
      }

      return `
        <div class="gb-entry">
          <div class="gb-entry-header">
            <span class="gb-entry-name">${this.escapeHtml(entry.name)}</span>
            <span class="gb-entry-date">${date}</span>
          </div>
          ${pageInfo}
          <div class="gb-entry-message">${this.escapeHtml(entry.message)}</div>
          ${website}
        </div>
      `;
    }

    async submitEntry() {
      const nameInput = document.getElementById("gb-name");
      const emailInput = document.getElementById("gb-email");
      const pageTitleInput = document.getElementById("gb-page-title");
      const pageUrlInput = document.getElementById("gb-page-url");
      const messageInput = document.getElementById("gb-message");
      const submitBtn = document.getElementById("gb-submit");
      const entriesContainer = document.getElementById("gb-entries");

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const pageTitle = pageTitleInput.value.trim();
      const pageUrl = pageUrlInput.value.trim();
      const message = messageInput.value.trim();

      if (!name || !message) {
        alert("Please fill in your name and message");
        return;
      }

      if (message.length > 500) {
        alert("Message cannot exceed 500 characters");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      try {
        const response = await fetch(`${this.options.apiUrl}/api/guestbook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            message,
            page_title: pageTitle,
            page_url: pageUrl,
          }),
        });

        if (response.ok) {
          const successMsg = document.createElement("div");
          successMsg.className = "gb-success";
          successMsg.textContent =
            "Thank you! Your entry has been submitted and will be reviewed.";
          entriesContainer?.parentElement?.insertBefore(
            successMsg,
            entriesContainer
          );

          // Clear form
          nameInput.value = "";
          emailInput.value = "";
          messageInput.value = "";

          // Hide form after successful submission
          this.hideForm();

          setTimeout(() => successMsg.remove(), 5000);
        } else {
          alert("Failed to submit entry. Please try again.");
        }
      } catch (error) {
        alert("An error occurred. Please try again.");
        console.error("Error submitting entry:", error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }
    }

    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Auto-initialize if container exists
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      const container = document.getElementById("guestbook-widget");
      if (container) {
        new GuestbookWidget("guestbook-widget");
      }
    });
  } else {
    const container = document.getElementById("guestbook-widget");
    if (container) {
      new GuestbookWidget("guestbook-widget");
    }
  }

  // Export for manual initialization
  if (typeof window !== "undefined") {
    window.GuestbookWidget = GuestbookWidget;
  }
})();
