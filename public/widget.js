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
          <button id="gb-show-form" class="gb-show-form-btn">Jätä viesti</button>
          <div class="gb-form gb-form-hidden" id="gb-form-container">
            <input type="text" id="gb-name" placeholder="Nimesi" required>
            <input type="email" id="gb-email" placeholder="Sähköpostisi (valinnainen)">
            <input type="text" id="gb-page-title" value="Jakso: ${this.escapeHtml(
              pageTitle
            )}" readonly disabled class="gb-page-title">
            <input type="hidden" id="gb-page-url" value="${this.escapeHtml(
              pageUrl
            )}">
            <textarea id="gb-message" placeholder="Viestisi" required maxlength="500"></textarea>
            <div class="gb-char-count" id="gb-char-count">0 / 500 merkkiä</div>
            <div class="gb-form-actions">
              <button id="gb-submit">Lähetä</button>
              <button type="button" id="gb-cancel" class="gb-cancel-btn">Peruuta</button>
            </div>
          </div>
          <div class="gb-entries" id="gb-entries">
            <div class="gb-loading">Ladataan viestejä...</div>
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
          display: flex;
          margin-bottom: 40px;
          gap: 15px;
        }
        .gb-entry-left {
          flex-shrink: 0;
          width: 120px;
        }
        .gb-entry-name {
          font-weight: 500;
          display: block;
        }
        .gb-entry-date {
          font-size: 12px;
          color: #666;
          display: block;
        }
        .gb-entry-right {
          flex: 1;
        }
        .gb-entry-message {
          background: #f0f0f0;
          padding: 12px 16px;
          border-radius: 8px;
          line-height: 1.6;
          white-space: pre-wrap;
          margin-bottom: 8px;
          position: relative;
        }
        .gb-entry-message::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 12px;
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-right: 8px solid #f0f0f0;
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
          margin-top: 8px;
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

      charCount.textContent = `${length} / ${maxLength} merkkiä`;

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
            '<div class="gb-empty">Ei vielä viestejä. Ole ensimmäinen, joka jättää viestin!</div>';
          return;
        }

        entriesContainer.innerHTML = entries
          .map((entry) => this.renderEntry(entry))
          .join("");
      } catch (error) {
        entriesContainer.innerHTML =
          '<div class="gb-error">Viestien lataaminen epäonnistui. Yritä myöhemmin uudelleen.</div>';
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
        const pageTitle = entry.page_title || "Näytä julkaisu";
        const pageUrl = entry.page_url;
        pageInfo = `<div class="gb-entry-page">
          <span class="gb-entry-page-icon">🔗</span>
          <a href="${this.escapeHtml(
            pageUrl
          )}" target="_blank" rel="noopener">Jakso: ${this.escapeHtml(
          pageTitle
        )}</a>
        </div>`;
      }

      return `
        <div class="gb-entry">
          <div class="gb-entry-left">
            <span class="gb-entry-name">${this.escapeHtml(entry.name)}</span>
            <span class="gb-entry-date">${date}</span>
          </div>
          <div class="gb-entry-right">
            <div class="gb-entry-message">${this.escapeHtml(
              entry.message
            )}</div>
            ${pageInfo}
            ${website}
          </div>
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
        alert("Täytä nimesi ja viestisi");
        return;
      }

      if (message.length > 500) {
        alert("Viesti ei voi ylittää 500 merkkiä");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Lähetetään...";

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
            "Kiitos! Viestisi on lähetetty ja se tarkistetaan.";
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
          alert("Viestin lähetys epäonnistui. Yritä uudelleen.");
        }
      } catch (error) {
        alert("Tapahtui virhe. Yritä uudelleen.");
        console.error("Error submitting entry:", error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Lähetä";
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
