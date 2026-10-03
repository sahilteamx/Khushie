(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const list = $("#messageList");
  const status = $("#messagesStatus");
  const total = $("#messageTotal");
  const refresh = $("#refreshMessages");
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content || "";

  const setStatus = (text, kind = "") => { if (!status) return; status.textContent = text; status.dataset.state = kind; };
  const escapeText = (value) => String(value ?? "");
  const formatDate = (value) => { const date = new Date(String(value).replace(" ", "T") + "Z"); return Number.isNaN(date.getTime()) ? String(value || "") : date.toLocaleString(); };

  async function loadMessages() {
    if (!list) return;
    list.setAttribute("aria-busy", "true"); setStatus("Loading messages…");
    try {
      const response = await fetch("../php/get-messages.php?limit=200", { credentials: "same-origin", headers: { Accept: "application/json" }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Messages could not be loaded.");
      const messages = Array.isArray(data.data) ? data.data : (Array.isArray(data.messages) ? data.messages : []);
      if (total) total.textContent = String(data.meta?.total ?? data.total ?? messages.length);
      list.replaceChildren();
      if (!messages.length) { const empty = document.createElement("p"); empty.className = "admin-empty"; empty.textContent = "No messages yet."; list.appendChild(empty); setStatus("Inbox is empty."); return; }
      messages.forEach((item) => {
        const article = document.createElement("article"); article.className = "message-item";
        article.innerHTML = '<div class="message-item-top"><div class="message-identity"><strong></strong><time></time></div><button class="delete-message" type="button">Delete</button></div><div class="message-item-body"></div>';
        article.querySelector("strong").textContent = escapeText(item.name);
        article.querySelector("time").textContent = formatDate(item.created_at);
        article.querySelector(".message-item-body").textContent = escapeText(item.message);
        const button = article.querySelector("button");
        button.addEventListener("click", () => deleteMessage(item.id, article));
        list.appendChild(article);
      });
      setStatus(`${messages.length} message${messages.length === 1 ? "" : "s"} shown.`, "success");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Messages could not be loaded.", "error"); }
    finally { list.setAttribute("aria-busy", "false"); }
  }

  async function deleteMessage(id, article) {
    if (!window.confirm("Delete this birthday message?")) return;
    try {
      const response = await fetch("../php/delete-message.php", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json", "Content-Type": "application/json", "X-CSRF-Token": csrf }, body: JSON.stringify({ id, csrf }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Message could not be deleted.");
      article?.remove(); setStatus("Message deleted."); if (total) total.textContent = String(Math.max(0, Number(total.textContent || 0) - 1));
      if (!list.querySelector(".message-item")) { const empty = document.createElement("p"); empty.className = "admin-empty"; empty.textContent = "No messages yet."; list.appendChild(empty); }
    } catch (error) { setStatus(error instanceof Error ? error.message : "Message could not be deleted.", "error"); }
  }

  refresh?.addEventListener("click", loadMessages); loadMessages();
})();
