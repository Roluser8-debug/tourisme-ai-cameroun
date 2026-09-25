// Bulle de discussion de l'assistant IA — parle à /api/chat (fonction Netlify)
// Guide vocal : lecture des réponses à voix haute (speechSynthesis) et question dictée au micro
// (SpeechRecognition, seulement sur les navigateurs qui le proposent : Chrome, Edge, Safari).
// Tout se fait dans le navigateur, sans service payant en plus.

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("chatbot-widget");
  if (!root) return;

  const { t } = window.CamtourI18n;
  const VOICE_KEY = "camtour-voice";
  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  root.innerHTML = `
    <button class="chatbot-launcher" aria-label="${esc(t("chat_launcher_aria"))}">💬</button>
    <div class="chatbot-panel" hidden>
      <div class="chatbot-header">
        <span class="chatbot-title">${esc(t("chat_header"))}</span>
        <span class="chatbot-header-actions">
          ${synth ? `<button type="button" class="chatbot-voice-toggle" aria-pressed="false">🔇</button>` : ""}
          <button class="chatbot-close" aria-label="${esc(t("chat_close_aria"))}">✕</button>
        </span>
      </div>
      <div class="chatbot-messages" role="log" aria-live="polite"></div>
      <form class="chatbot-form">
        <label for="chatbot-input" class="sr-only">${esc(t("chat_input_label"))}</label>
        ${Recognition ? `<button type="button" class="chatbot-mic" aria-label="${esc(t("voice_mic_aria"))}" title="${esc(t("voice_mic_aria"))}">🎤</button>` : ""}
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
  const voiceToggle = root.querySelector(".chatbot-voice-toggle");
  const micBtn = root.querySelector(".chatbot-mic");
  const messagesEl = root.querySelector(".chatbot-messages");
  const form = root.querySelector(".chatbot-form");
  const input = root.querySelector(".chatbot-input");

  // ---------- Guide vocal : lecture à voix haute ----------

  let voiceOn = false;
  try {
    voiceOn = localStorage.getItem(VOICE_KEY) === "on";
  } catch (err) {
    /* stockage indisponible : guide vocal désactivé par défaut */
  }
  let speakingButton = null; // bouton « Écouter » de la réponse en cours de lecture

  function renderVoiceToggle() {
    if (!voiceToggle) return;
    voiceToggle.textContent = voiceOn ? "🔊" : "🔇";
    voiceToggle.setAttribute("aria-pressed", String(voiceOn));
    const label = t(voiceOn ? "voice_toggle_on" : "voice_toggle_off");
    voiceToggle.setAttribute("aria-label", label);
    voiceToggle.title = label;
  }

  // Retire ce qui se lit mal à voix haute : emojis, astérisques/dièses de mise en forme, liens.
  function cleanForSpeech(text) {
    return String(text)
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[*#_`>|]/g, " ")
      .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Choisit une voix de la langue du site (française ou anglaise) si le navigateur en a une.
  function pickVoice(lang) {
    const voices = synth.getVoices();
    return voices.find((v) => v.lang.toLowerCase().startsWith(lang) && /google|natural|online/i.test(v.name))
      || voices.find((v) => v.lang.toLowerCase().startsWith(lang))
      || null;
  }

  function resetSpeakingButton() {
    if (speakingButton) speakingButton.textContent = t("voice_replay");
    speakingButton = null;
  }

  function stopSpeaking() {
    if (synth) synth.cancel();
    resetSpeakingButton();
  }

  function speak(text, button) {
    if (!synth) return;
    stopSpeaking();
    const clean = cleanForSpeech(text);
    if (!clean) return;
    const lang = window.CamtourI18n.getLang();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === "en" ? "en-GB" : "fr-FR";
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.rate = 1;
    if (button) {
      speakingButton = button;
      button.textContent = t("voice_stop");
    }
    utterance.onend = utterance.onerror = () => {
      if (speakingButton === button) resetSpeakingButton();
    };
    synth.speak(utterance);
  }

  if (synth) {
    // Certains navigateurs chargent la liste des voix un peu après l'ouverture de la page.
    synth.getVoices();
    if ("onvoiceschanged" in synth) synth.onvoiceschanged = () => synth.getVoices();
  }

  if (voiceToggle) {
    renderVoiceToggle();
    voiceToggle.addEventListener("click", () => {
      voiceOn = !voiceOn;
      try {
        localStorage.setItem(VOICE_KEY, voiceOn ? "on" : "off");
      } catch (err) {
        /* stockage indisponible : le choix ne survivra pas à cette page */
      }
      renderVoiceToggle();
      if (!voiceOn) stopSpeaking();
    });
  }

  // ---------- Messages ----------

  // Retraduit les éléments fixes de la bulle quand la langue change (le contenu déjà écrit
  // dans la conversation, lui, reste tel quel : il a été répondu dans la langue du moment).
  window.addEventListener("camtour-lang-changed", () => {
    stopSpeaking();
    launcher.setAttribute("aria-label", t("chat_launcher_aria"));
    root.querySelector(".chatbot-title").textContent = t("chat_header");
    closeBtn.setAttribute("aria-label", t("chat_close_aria"));
    input.placeholder = t("chat_input_placeholder");
    form.querySelector(".chatbot-send").textContent = t("chat_send");
    if (micBtn) {
      micBtn.setAttribute("aria-label", t("voice_mic_aria"));
      micBtn.title = t("voice_mic_aria");
    }
    renderVoiceToggle();
    messagesEl.querySelectorAll(".chatbot-listen").forEach((btn) => {
      btn.textContent = t("voice_replay");
    });
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

  // Ajoute sous une réponse de l'assistant un petit bouton pour l'écouter (ou arrêter la lecture).
  function addListenButton(bubble, text) {
    if (!synth) return null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chatbot-listen";
    btn.textContent = t("voice_replay");
    btn.addEventListener("click", () => {
      if (speakingButton === btn) stopSpeaking();
      else speak(text, btn);
    });
    bubble.appendChild(document.createElement("br"));
    bubble.appendChild(btn);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return btn;
  }

  function showReply(bubble, text) {
    bubble.textContent = text;
    const btn = addListenButton(bubble, text);
    if (voiceOn) speak(text, btn);
  }

  launcher.addEventListener("click", () => {
    panel.hidden = false;
    launcher.hidden = true;
    if (!hasGreeted) {
      hasGreeted = true;
      const greeting = t("chat_greeting");
      const bubble = addMessage("assistant", greeting);
      addListenButton(bubble, greeting);
    }
    input.focus();
  });

  closeBtn.addEventListener("click", () => {
    stopSpeaking();
    stopListening();
    panel.hidden = true;
    launcher.hidden = false;
  });

  // ---------- Guide vocal : question dictée au micro ----------

  let recognition = null;

  function stopListening() {
    if (recognition) recognition.abort();
  }

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (recognition) {
        recognition.stop();
        return;
      }
      stopSpeaking();
      recognition = new Recognition();
      recognition.lang = window.CamtourI18n.getLang() === "en" ? "en-GB" : "fr-FR";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const previousPlaceholder = input.placeholder;
      input.placeholder = t("voice_listening");
      micBtn.classList.add("is-listening");
      let finalText = "";
      let failed = false;

      recognition.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i += 1) {
          text += event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText = text;
        }
        input.value = text;
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed" || event.error === "audio-capture") {
          failed = true;
          addMessage("assistant", t("voice_mic_error"));
        }
      };
      recognition.onend = () => {
        recognition = null;
        micBtn.classList.remove("is-listening");
        input.placeholder = previousPlaceholder;
        // Question dictée complète : on l'envoie directement, comme si on avait cliqué sur « Envoyer ».
        if (!failed && finalText.trim()) {
          input.value = finalText.trim();
          form.requestSubmit();
        } else {
          input.focus();
        }
      };
      recognition.start();
    });
  }

  // ---------- Envoi de la question ----------

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || input.disabled) return;

    stopSpeaking();
    addMessage("user", text);
    history.push({ role: "user", content: text });
    input.value = "";
    input.disabled = true;
    if (micBtn) micBtn.disabled = true;

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
        showReply(thinkingBubble, data.reply);
        history.push({ role: "assistant", content: data.reply });
      }
    } catch (err) {
      thinkingBubble.textContent = t("chat_network_error");
    } finally {
      input.disabled = false;
      if (micBtn) micBtn.disabled = false;
      input.focus();
    }
  });
});
