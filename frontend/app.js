const apiBaseInput = document.getElementById("apiBase");
const pingBtn = document.getElementById("ping");
const healthEl = document.getElementById("health");
const uploadBtn = document.getElementById("upload");
const pdfInput = document.getElementById("pdfInput");
const ingestStatus = document.getElementById("ingestStatus");
const loadDocBtn = document.getElementById("loadDoc");
const docMeta = document.getElementById("docMeta");
const pagesEl = document.getElementById("pages");
const queryInput = document.getElementById("query");
const topKInput = document.getElementById("topK");
const searchBtn = document.getElementById("search");
const searchStatus = document.getElementById("searchStatus");
const resultsEl = document.getElementById("results");
const qaQuestion = document.getElementById("qaQuestion");
const qaTopK = document.getElementById("qaTopK");
const qaBtn = document.getElementById("qaBtn");
const qaStatus = document.getElementById("qaStatus");
const qaAnswer = document.getElementById("qaAnswer");
const qaToggle = document.getElementById("qaToggle");
const qaContexts = document.getElementById("qaContexts");

let latestDocId = null;
let qaContextData = [];

function apiBase() {
  return apiBaseInput.value.replace(/\/$/, "");
}

function setStatus(el, message, tone = "neutral") {
  el.textContent = message;
  el.style.color = tone === "ok" ? "#56f2b3" : tone === "error" ? "#ff7b7b" : "#9fb1b9";
}

function renderQaContexts() {
  qaContexts.innerHTML = "";
  if (!qaContextData.length) {
    qaContexts.textContent = "No contexts available.";
    return;
  }

  qaContextData.forEach((ctx, idx) => {
    const card = document.createElement("div");
    card.className = "context-card";

    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.textContent = `Context ${idx + 1} • doc: ${ctx.doc_id} • page: ${ctx.page} • score: ${ctx.score.toFixed(3)}`;

    const text = document.createElement("div");
    text.textContent = ctx.text;

    card.appendChild(meta);
    card.appendChild(text);
    qaContexts.appendChild(card);
  });
}

pingBtn.addEventListener("click", async () => {
  setStatus(healthEl, "Checking...");
  try {
    const res = await fetch(`${apiBase()}/health`);
    if (!res.ok) throw new Error("Health check failed");
    const data = await res.json();
    setStatus(healthEl, `OK: ${data.status}`, "ok");
  } catch (err) {
    setStatus(healthEl, "API unreachable", "error");
  }
});

uploadBtn.addEventListener("click", async () => {
  const file = pdfInput.files[0];
  if (!file) {
    setStatus(ingestStatus, "Please select a PDF file.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  setStatus(ingestStatus, "Uploading and processing...");
  try {
    const res = await fetch(`${apiBase()}/ingest`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "Ingestion failed");
    }

    latestDocId = data.doc_id;
    setStatus(
      ingestStatus,
      `Ingested ${data.original_filename} • pages: ${data.page_count} • chunks: ${data.index?.total_chunks ?? "-"}`,
      "ok"
    );
    docMeta.textContent = `Latest doc: ${latestDocId}`;
  } catch (err) {
    setStatus(ingestStatus, err.message, "error");
  }
});

loadDocBtn.addEventListener("click", async () => {
  if (!latestDocId) {
    setStatus(docMeta, "No document ingested yet.", "error");
    return;
  }

  setStatus(docMeta, "Loading OCR pages...");
  pagesEl.innerHTML = "";

  try {
    const res = await fetch(`${apiBase()}/documents/${latestDocId}`);
    if (!res.ok) throw new Error("Failed to fetch OCR outputs");
    const data = await res.json();

    docMeta.textContent = `Doc ${data.doc_id} • pages ${data.page_count}`;
    data.pages.forEach((page) => {
      const card = document.createElement("details");
      card.className = "page-card";
      card.open = false;

      const summary = document.createElement("summary");
      summary.textContent = `Page ${page.page}`;

      const text = document.createElement("div");
      text.className = "page-text";
      text.textContent = page.text || "(No text detected)";

      card.appendChild(summary);
      card.appendChild(text);
      pagesEl.appendChild(card);
    });
  } catch (err) {
    setStatus(docMeta, err.message, "error");
  }
});

searchBtn.addEventListener("click", async () => {
  const query = queryInput.value.trim();
  if (!query) {
    setStatus(searchStatus, "Enter a search query.", "error");
    return;
  }

  resultsEl.innerHTML = "";
  setStatus(searchStatus, "Searching...");

  try {
    const res = await fetch(`${apiBase()}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: Number(topKInput.value) || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Search failed");

    setStatus(searchStatus, `Found ${data.results.length} results`, "ok");

    data.results.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const title = document.createElement("h3");
      title.textContent = `Result ${idx + 1}`;

      const meta = document.createElement("div");
      meta.className = "result-meta";
      meta.textContent = `doc: ${item.doc_id} • page: ${item.page} • score: ${item.score.toFixed(3)}`;

      const text = document.createElement("div");
      text.textContent = item.text;

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(text);
      resultsEl.appendChild(card);
    });
  } catch (err) {
    setStatus(searchStatus, err.message, "error");
  }
});

qaBtn.addEventListener("click", async () => {
  const question = qaQuestion.value.trim();
  if (!question) {
    setStatus(qaStatus, "Enter a question.", "error");
    return;
  }

  qaAnswer.textContent = "";
  qaContextData = [];
  renderQaContexts();
  setStatus(qaStatus, "Thinking...");

  try {
    const res = await fetch(`${apiBase()}/qa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, top_k: Number(qaTopK.value) || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "QA failed");

    setStatus(qaStatus, `Answer from ${data.contexts.length} contexts`, "ok");
    qaAnswer.textContent = data.answer;
    qaContextData = data.contexts || [];
    if (!qaContexts.classList.contains("hidden")) {
      renderQaContexts();
    }
  } catch (err) {
    setStatus(qaStatus, err.message, "error");
  }
});

qaToggle.addEventListener("click", () => {
  const isHidden = qaContexts.classList.toggle("hidden");
  qaToggle.textContent = isHidden ? "Show Contexts" : "Hide Contexts";
  if (!isHidden) {
    renderQaContexts();
  }
});
