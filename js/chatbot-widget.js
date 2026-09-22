// Bulle de discussion de l'assistant IA — parle à /api/chat (fonction Netlify)

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("chatbot-widget");
  if (!root) return;

  const { t } = window.CamtourI18n;

  root.innerHTML = `
    <button class="chatbot-launcher" aria-label="${esc(t("chat_launcher_aria"))}">💬</button>
    <div class="chatbot-panel" hidden>
      <div class="chatbot-header">
        <span data-i18n="chat_header">${esc(t("chat_header"))}</span>
        <button class="chatbot-close" aria-label="${esc(t("chat_close_aria"))}">✕</button>
      </div>
      <div class="chatbot-messages" role="log" aria-live="polite"></div>
      <form class="chatbot-form">
        <label for="chatbot-input" class="sr-only">${esc(t("chat_input_label"))}</label>
        <input id="chatbot-input" type="text" class="chatbot-input" placeholder="${esc(t("chat_input_placeholder"))}" autocomplete="off" />
        <button type="submit" class="chatbot-send">${esc(t("chat_send"))}</button>
      </form>
    </div>
  `;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  const launcher = root.querySelector(".chatbot-launcher");
  const panel = root.querySelector(".chatbot-panel");
  const closeBtn = root.querySelector(".chatbot-close");
  const messagesEl = root.querySelector(".chatbot-messages");
  const form = root.querySelector(".chatbot-form");
  const input = root.querySelector(".chatbot-input");

  // Retraduit les éléments fixes de la bulle quand la langue change (le contenu déjà écrit
  // dans la conversation, lui, reste tel quel : il a été répondu dans la langue du moment).
  window.addEventListener("camtour-lang-changed", () => {
    launcher.setAttribute("aria-label", t("chat_launcher_aria"));
    root.querySelector(".chatbot-header span").textContent = t("chat_header");
    closeBtn.setAttribute("aria-label", t("chat_close_aria"));
    input.placeholder = t("chat_input_placeholder");
    form.querySelector(".chatbot-send").textContent = t("chat_send");
  });

  const history = [];
  let hasGreeted = false;

  function addMessage(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `chatbot-message chatbot-message--${role}`;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  launcher.addEventListener("click", () => {
    panel.hidden = false;
    launcher.hidden = true;
    if (!hasGreeted) {
      hasGreeted = true;
      addMessage("assistant", t("chat_greeting"));
    }
    input.focus();
  });

  closeBtn.addEventListener("click", () => {
    panel.hidden = true;
    launcher.hidden = false;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    history.push({ role: "user", content: text });
    input.value = "";
    input.disabled = true;

    const thinkingBubble = addMessage("assistant", "…");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang: window.CamtourI18n.getLang() }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(t("chat_server_error"));
      }

      if (!res.ok) {
        thinkingBubble.textContent = data.error || t("chat_unavailable");
      } else {
        thinkingBubble.textContent = data.reply;
        history.push({ role: "assistant", content: data.reply });
      }
    } catch (err) {
      thinkingBubble.textContent = t("chat_network_error");
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
});
