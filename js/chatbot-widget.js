// Bulle de discussion de l'assistant IA — parle à /api/chat (fonction Netlify)

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("chatbot-widget");
  if (!root) return;

  root.innerHTML = `
    <button class="chatbot-launcher" aria-label="Ouvrir l'assistant IA">💬</button>
    <div class="chatbot-panel" hidden>
      <div class="chatbot-header">
        <span>🇨🇲 Assistant Cameroun Tourisme</span>
        <button class="chatbot-close" aria-label="Fermer">✕</button>
      </div>
      <div class="chatbot-messages"></div>
      <form class="chatbot-form">
        <input type="text" class="chatbot-input" placeholder="Posez votre question..." autocomplete="off" />
        <button type="submit" class="chatbot-send">Envoyer</button>
      </form>
    </div>
  `;

  const launcher = root.querySelector(".chatbot-launcher");
  const panel = root.querySelector(".chatbot-panel");
  const closeBtn = root.querySelector(".chatbot-close");
  const messagesEl = root.querySelector(".chatbot-messages");
  const form = root.querySelector(".chatbot-form");
  const input = root.querySelector(".chatbot-input");

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
      addMessage(
        "assistant",
        "Bonjour ! Je suis votre assistant pour découvrir le Cameroun : écotourisme, culture, gastronomie et hôtels. Posez-moi une question, dans la langue de votre choix."
      );
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
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (!res.ok) {
        thinkingBubble.textContent =
          data.error || "L'assistant IA est momentanément indisponible.";
      } else {
        thinkingBubble.textContent = data.reply;
        history.push({ role: "assistant", content: data.reply });
      }
    } catch (err) {
      thinkingBubble.textContent =
        "Impossible de contacter l'assistant IA. Vérifiez votre connexion et réessayez.";
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
});
