const storageKey = "thirty-days-infinity-state-v2";

const integrations = {
  cms: "Supabase",
  authProviders: ["Google", "Facebook"],
  checkout: "USD checkout",
  communityModeration: "reddit_first"
};

const redditCommunityUrl = "https://www.reddit.com/r/30DaystoInfinity/";
const redditSubmitUrl = "https://www.reddit.com/r/30DaystoInfinity/submit";
const questionPreferenceCookie = "question_destination";
const moonPhases = [
  { max: 1, glyph: "🌑", name: "New moon", note: "The month begins in darkness and intention." },
  { max: 3, glyph: "🌒", name: "Waxing crescent", note: "A first sliver of practice begins to gather light." },
  { max: 6, glyph: "🌓", name: "First quarter", note: "The practice asks for choice, structure, and attention." },
  { max: 10, glyph: "🌔", name: "Waxing gibbous", note: "The inner work grows brighter and harder to ignore." },
  { max: 15, glyph: "🌕", name: "Full moon", note: "The midpoint arrives with fullness, reflection, and visibility." },
  { max: 19, glyph: "🌖", name: "Waning gibbous", note: "The light begins to turn inward and become wisdom." },
  { max: 23, glyph: "🌗", name: "Last quarter", note: "The work becomes cleaner, quieter, and more deliberate." },
  { max: 27, glyph: "🌘", name: "Waning crescent", note: "Release what is no longer needed for the next beginning." },
  { max: 30, glyph: "🌑", name: "New moon", note: "The month closes as another beginning opens." }
];

const defaultChapters = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  return {
    day,
    title: `Day ${day}: ${[
      "Begin Where You Are",
      "The Shape of Attention",
      "Naming the Threshold",
      "Clearing Inner Weather",
      "The First Vastness",
      "A Practice of Listening",
      "The Room Within",
      "Meeting Resistance",
      "The Honest Question",
      "Small Devotions",
      "Time as Teacher",
      "The Edge of Control",
      "Releasing the Old Map",
      "Body as Compass",
      "Halfway to Infinity",
      "The Courage to Receive",
      "Quiet Power",
      "Seeing the Pattern",
      "The Generous Pause",
      "The Work of Wonder",
      "Repair and Return",
      "The Inner Horizon",
      "Choosing the Practice",
      "A Wider Identity",
      "Love as Direction",
      "The Discipline of Awe",
      "What Remains",
      "The Open Gate",
      "Living the Infinite",
      "The Beginning Again"
    ][index]}`,
    body:
      "This is editable chapter content for the author CMS. Replace this placeholder with the day's essay, teaching, story, or reflection. The reader experience updates immediately after you save.",
    exercise:
      "Write one honest paragraph about what this day is asking you to notice, practice, or release.",
    video: ""
  };
});

const defaultProducts = [
  {
    id: crypto.randomUUID(),
    name: "Autographed hardcover",
    description: "A signed copy of 30 Days to Infinity, packed with a personal note from the author.",
    price: 38,
    shipping: 7
  },
  {
    id: crypto.randomUUID(),
    name: "Workbook companion",
    description: "A printed companion workbook for readers who prefer handwriting their daily reflections.",
    price: 22,
    shipping: 5
  }
];

const state = loadState();
let selectedDay = 1;
let currentUser = state.currentUser;

if (location.hostname.startsWith("admin.") && !location.pathname.includes("admin.html")) {
  location.replace("/admin.html");
}

const redditCommunityLink = document.querySelector("#redditCommunityLink");
if (redditCommunityLink) redditCommunityLink.href = redditCommunityUrl;

document.querySelector("#adminLoginForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#adminEmail").value.trim();
  const password = document.querySelector("#adminPassword").value.trim();
  const status = document.querySelector("#adminLoginStatus");
  if (!email || !password) {
    status.textContent = "Enter an email and password to open the CMS.";
    return;
  }
  sessionStorage.setItem("admin-authenticated", "true");
  document.querySelector("#adminLoginForm").classList.add("admin-locked");
  document.querySelector("#adminArea").classList.add("active");
  status.textContent = "Logged in.";
});

if (sessionStorage.getItem("admin-authenticated") === "true") {
  document.querySelector("#adminLoginForm")?.classList.add("admin-locked");
  document.querySelector("#adminArea")?.classList.add("active");
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (saved) return JSON.parse(saved);
  return {
    chapters: defaultChapters,
    workbook: {},
    completed: [],
    questions: [
      {
        id: crypto.randomUUID(),
        name: "Mira",
        text: "How should I continue the practice after the 30th day?",
        status: "approved",
        answer: "Return to the chapter that changed your breathing first. Let that become your next doorway."
      }
    ],
    products: defaultProducts,
    cart: {},
    currentUser: null
  };
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  localStorage.setItem(name, value);
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1] || localStorage.getItem(name);
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function chapterByDay(day) {
  return state.chapters.find((chapter) => chapter.day === Number(day));
}

function moonPhaseForDay(day) {
  return moonPhases.find((phase) => day <= phase.max) || moonPhases[moonPhases.length - 1];
}

function renderFormattedText(target, text) {
  if (!target) return;
  target.innerHTML = "";
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    const empty = document.createElement("p");
    empty.textContent = "This chapter is waiting for content.";
    target.append(empty);
    return;
  }

  paragraphs.forEach((paragraph) => {
    const block = document.createElement("p");
    block.textContent = paragraph;
    target.append(block);
  });
}

function youtubeEmbedUrl(value) {
  if (!value) return "";
  const trimmed = value.trim();
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/
  ];
  const match = patterns.map((pattern) => trimmed.match(pattern)).find(Boolean);
  const videoId = match ? match[1] : trimmed;
  return /^[a-zA-Z0-9_-]{6,}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : "";
}

function renderChapterVideo(chapter) {
  const target = document.querySelector("#chapterVideo");
  if (!target) return;
  const embedUrl = youtubeEmbedUrl(chapter.video || chapter.videoUrl || "");
  if (embedUrl) {
    target.innerHTML = `
      <iframe
        src="${embedUrl}"
        title="${chapter.title} video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    `;
    return;
  }
  target.innerHTML = `
    <div class="video-placeholder">
      <strong>Chapter video</strong>
      <span>YouTube video placeholder for ${chapter.title}</span>
    </div>
  `;
}

function renderChapters() {
  const list = document.querySelector("#chapterList");
  if (!list) return;
  list.innerHTML = "";
  state.chapters.forEach((chapter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = chapter.day === selectedDay ? "active" : "";
    button.innerHTML = `
      <span class="chapter-day">${chapter.day}</span>
      <span class="chapter-list-moon" aria-hidden="true">${moonPhaseForDay(chapter.day).glyph}</span>
      <span class="chapter-label">${chapter.title.replace(/^Day \d+:\s*/, "")}</span>
    `;
    button.addEventListener("click", () => {
      selectedDay = chapter.day;
      renderChapters();
      renderWorkbook();
      renderCmsChapter();
    });
    list.append(button);
  });

  const chapter = chapterByDay(selectedDay);
  document.querySelector("#chapterMeta").textContent = `Day ${chapter.day} of 30`;
  document.querySelector("#chapterTitle").textContent = chapter.title;
  renderChapterVideo(chapter);
  renderFormattedText(document.querySelector("#chapterBody"), chapter.body);
  document.querySelector("#toggleComplete").textContent = state.completed.includes(selectedDay) ? "✓" : "○";
  const moonPhase = moonPhaseForDay(chapter.day);
  document.querySelector("#moonGlyph").textContent = moonPhase.glyph;
  document.querySelector("#moonPhase").setAttribute("aria-label", `${moonPhase.name} for day ${chapter.day}`);
  const proceedButton = document.querySelector("#proceedChapter");
  const askButton = document.querySelector("#askChapterQuestion");
  if (proceedButton) proceedButton.textContent = chapter.day < 30 ? `Proceed to Day ${chapter.day + 1}` : "Begin Again";
  if (askButton) askButton.textContent = `Ask a Question about Day ${chapter.day}`;
}

function renderSelectors() {
  ["#workbookDay", "#cmsDay"].forEach((selector) => {
    const select = document.querySelector(selector);
    if (!select) return;
    select.innerHTML = "";
    state.chapters.forEach((chapter) => {
      const option = document.createElement("option");
      option.value = chapter.day;
      option.textContent = `Day ${chapter.day}`;
      select.append(option);
    });
    select.value = selectedDay;
  });
}

function renderWorkbook() {
  if (!document.querySelector("#workbookDay")) return;
  const chapter = chapterByDay(selectedDay);
  document.querySelector("#workbookDay").value = selectedDay;
  renderFormattedText(document.querySelector("#workbookExercise"), chapter.exercise);
  document.querySelector("#workbookResponse").value = state.workbook[selectedDay] || "";
  document.querySelector("#currentUser").textContent = currentUser
    ? `Signed in as ${currentUser.name} via ${currentUser.provider}`
    : "Signed out";
  document.querySelector("#loginButton").textContent = currentUser ? "Sign out" : "Sign in";
}

function renderCmsChapter() {
  if (!document.querySelector("#cmsDay")) return;
  const chapter = chapterByDay(selectedDay);
  document.querySelector("#cmsDay").value = selectedDay;
  document.querySelector("#cmsTitle").value = chapter.title;
  document.querySelector("#cmsVideo").value = chapter.video || chapter.videoUrl || "";
  document.querySelector("#cmsBody").value = chapter.body;
  document.querySelector("#cmsExercise").value = chapter.exercise;
}

function renderCommunity() {
  const board = document.querySelector("#questionBoard");
  const moderation = document.querySelector("#moderationList");
  if (board) board.innerHTML = "";
  if (moderation) moderation.innerHTML = "";

  if (board) {
    state.questions
      .filter((question) => question.status === "approved" || question.status === "pending")
      .forEach((question) => board.append(questionCard(question)));

    if (!board.children.length) {
      board.innerHTML = '<div class="question-card pending"><strong>No questions yet.</strong><p>Ask on Reddit or post inside the website community.</p></div>';
    }
  }

  if (moderation) {
    state.questions.forEach((question) => moderation.append(moderationCard(question)));
    if (!moderation.children.length) {
      moderation.innerHTML = '<div class="moderation-card"><strong>No questions yet.</strong><p>Reader submissions will appear here.</p></div>';
    }
  }
}

function questionCard(question) {
  const card = document.createElement("article");
  card.className = question.status === "pending" ? "question-card pending" : "question-card";
  card.innerHTML = `
    <strong>${question.name}</strong>
    <p>${question.text}</p>
    ${question.status === "pending" ? "<p><strong>Pending review</strong></p>" : ""}
    ${question.answer ? `<div class="answer"><strong>Author answer</strong><p>${question.answer}</p></div>` : ""}
  `;
  return card;
}

function openRedditQuestion(chapter = chapterByDay(selectedDay)) {
  const submitUrl = new URL(redditSubmitUrl);
  submitUrl.searchParams.set("title", `Question about ${chapter.title}`);
  submitUrl.searchParams.set(
    "text",
    `I am reading ${chapter.title}. My question is:\n\n`
  );
  window.open(submitUrl.toString(), "_blank", "noopener,noreferrer");
}

function openSiteQuestion(chapter = chapterByDay(selectedDay)) {
  document.querySelector("#community")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const questionBox = document.querySelector("#siteQuestionText");
  if (questionBox) {
    questionBox.value = `Question about ${chapter.title}\n\n`;
    questionBox.focus();
  }
}

function saveQuestionPreferenceIfNeeded(destination) {
  if (document.querySelector("#saveQuestionChoice")?.checked) {
    setCookie(questionPreferenceCookie, destination);
  }
}

function askQuestion(destination) {
  const chapter = chapterByDay(selectedDay);
  if (destination === "reddit") {
    openRedditQuestion(chapter);
    return;
  }
  openSiteQuestion(chapter);
}

function showQuestionChoice() {
  document.querySelector("#questionChoiceModal").hidden = false;
}

function hideQuestionChoice() {
  document.querySelector("#questionChoiceModal").hidden = true;
}

function moderationCard(question) {
  const card = document.createElement("article");
  card.className = "moderation-card";
  card.innerHTML = `
    <strong>${question.name} · ${question.status}</strong>
    <p>${question.text}</p>
    <label>Author answer<textarea rows="3">${question.answer || ""}</textarea></label>
    <div class="form-row">
      <button class="primary-button" type="button">Approve</button>
      <button class="secondary-button" type="button">Hide</button>
    </div>
  `;
  const answer = card.querySelector("textarea");
  card.querySelector(".primary-button").addEventListener("click", () => {
    question.status = "approved";
    question.answer = answer.value.trim();
    persist();
    renderAll();
  });
  card.querySelector(".secondary-button").addEventListener("click", () => {
    question.status = "hidden";
    persist();
    renderAll();
  });
  return card;
}

function renderShop() {
  const productGrid = document.querySelector("#productGrid");
  if (!productGrid) return;
  productGrid.innerHTML = "";
  state.products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <strong>${product.name}</strong>
      <p>${product.description}</p>
      <p>${money(product.price)} + ${money(product.shipping)} shipping</p>
      <button class="primary-button" type="button">Add to cart</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      state.cart[product.id] = (state.cart[product.id] || 0) + 1;
      persist();
      renderShop();
    });
    productGrid.append(card);
  });

  const cartItems = document.querySelector("#cartItems");
  cartItems.innerHTML = "";
  let subtotal = 0;
  let shipping = 0;
  Object.entries(state.cart).forEach(([productId, quantity]) => {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;
    subtotal += product.price * quantity;
    shipping += product.shipping * quantity;
    const item = document.createElement("div");
    item.className = "cart-item";
    item.textContent = `${quantity} × ${product.name}`;
    cartItems.append(item);
  });
  if (!cartItems.children.length) cartItems.innerHTML = '<p class="helper-text">Your cart is empty.</p>';
  document.querySelector("#cartSubtotal").textContent = money(subtotal);
  document.querySelector("#cartShipping").textContent = money(shipping);
  document.querySelector("#cartTotal").textContent = money(subtotal + shipping);
}

function renderStats() {
  return {
    savedWorkbookEntries: Object.keys(state.workbook).length,
    communityQuestions: state.questions.length,
    shopProducts: state.products.length
  };
}

function renderAll() {
  renderSelectors();
  renderChapters();
  renderWorkbook();
  renderCmsChapter();
  renderCommunity();
  renderShop();
  renderStats();
}

document.querySelector("#toggleComplete")?.addEventListener("click", () => {
  if (state.completed.includes(selectedDay)) {
    state.completed = state.completed.filter((day) => day !== selectedDay);
  } else {
    state.completed.push(selectedDay);
  }
  persist();
  renderAll();
});

document.querySelector("#toggleChapterNav")?.addEventListener("click", () => {
  const layout = document.querySelector("#readerLayout");
  layout.classList.toggle("chapter-nav-minimized");
  const minimized = layout.classList.contains("chapter-nav-minimized");
  document.querySelector("#toggleChapterNav").title = minimized ? "Expand chapter list" : "Minimize chapter list";
});

document.querySelector("#proceedChapter")?.addEventListener("click", () => {
  selectedDay = selectedDay < 30 ? selectedDay + 1 : 1;
  renderAll();
  document.querySelector("#chapters")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("#askChapterQuestion")?.addEventListener("click", () => {
  const preference = decodeURIComponent(getCookie(questionPreferenceCookie) || "");
  if (preference === "reddit" || preference === "site") {
    askQuestion(preference);
    return;
  }
  showQuestionChoice();
});

document.querySelector("#chooseRedditQuestion")?.addEventListener("click", () => {
  saveQuestionPreferenceIfNeeded("reddit");
  hideQuestionChoice();
  askQuestion("reddit");
});

document.querySelector("#chooseSiteQuestion")?.addEventListener("click", () => {
  saveQuestionPreferenceIfNeeded("site");
  hideQuestionChoice();
  askQuestion("site");
});

document.querySelector("#closeQuestionChoice")?.addEventListener("click", hideQuestionChoice);

document.querySelector("#workbookDay")?.addEventListener("change", (event) => {
  selectedDay = Number(event.target.value);
  renderAll();
});

document.querySelector("#cmsDay")?.addEventListener("change", (event) => {
  selectedDay = Number(event.target.value);
  renderAll();
});

document.querySelector("#saveWorkbook")?.addEventListener("click", () => {
  if (!currentUser) {
    document.querySelector("#workbookStatus").textContent = "Please sign in before saving workbook responses.";
    return;
  }
  state.workbook[selectedDay] = document.querySelector("#workbookResponse").value.trim();
  persist();
  document.querySelector("#workbookStatus").textContent = "Saved.";
  renderStats();
});

document.querySelector("#clearWorkbook")?.addEventListener("click", () => {
  delete state.workbook[selectedDay];
  persist();
  renderAll();
});

document.querySelectorAll(".provider").forEach((button) => {
  button.addEventListener("click", () => {
    currentUser = { name: "Reader", provider: button.dataset.provider };
    state.currentUser = currentUser;
    persist();
    renderWorkbook();
  });
});

document.querySelector("#loginButton")?.addEventListener("click", () => {
  currentUser = currentUser ? null : { name: "Reader", provider: integrations.authProviders[0] };
  state.currentUser = currentUser;
  persist();
  renderWorkbook();
});

document.querySelector("#redditQuestionForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#redditTitle").value.trim();
  const body = document.querySelector("#redditBody").value.trim();
  const status = document.querySelector("#redditStatus");
  if (!title) {
    status.textContent = "Add a question title before opening Reddit.";
    return;
  }
  const submitUrl = new URL(redditSubmitUrl);
  submitUrl.searchParams.set("title", title);
  submitUrl.searchParams.set("text", body);
  window.open(submitUrl.toString(), "_blank", "noopener,noreferrer");
  status.textContent = "Reddit opened in a new tab. Post your question in the book subreddit.";
});

document.querySelector("#siteQuestionForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#siteQuestionName").value.trim() || "Anonymous reader";
  const text = document.querySelector("#siteQuestionText").value.trim();
  const status = document.querySelector("#siteQuestionStatus");
  if (!text) {
    status.textContent = "Write a question before posting.";
    return;
  }
  state.questions.unshift({
    id: crypto.randomUUID(),
    name,
    text,
    status: "pending",
    answer: ""
  });
  persist();
  document.querySelector("#siteQuestionForm").reset();
  status.textContent = "Question saved to the website community and marked pending review.";
  renderCommunity();
});

document.querySelector("#saveChapter")?.addEventListener("click", () => {
  const chapter = chapterByDay(selectedDay);
  chapter.title = document.querySelector("#cmsTitle").value.trim();
  chapter.video = document.querySelector("#cmsVideo").value.trim();
  chapter.body = document.querySelector("#cmsBody").value.trim();
  chapter.exercise = document.querySelector("#cmsExercise").value.trim();
  persist();
  renderAll();
});

document.querySelectorAll("[data-admin-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-admin-tab]").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#admin-${tab.dataset.adminTab}`).classList.add("active");
  });
});

document.querySelector("#addProduct")?.addEventListener("click", () => {
  const name = document.querySelector("#productName").value.trim();
  if (!name) return;
  state.products.push({
    id: crypto.randomUUID(),
    name,
    description: document.querySelector("#productDescription").value.trim(),
    price: Number(document.querySelector("#productPrice").value || 0),
    shipping: Number(document.querySelector("#productShipping").value || 0)
  });
  document.querySelector("#productName").value = "";
  document.querySelector("#productDescription").value = "";
  document.querySelector("#productPrice").value = "";
  document.querySelector("#productShipping").value = "";
  persist();
  renderAll();
});

document.querySelector("#checkoutButton")?.addEventListener("click", () => {
  const quantity = Object.values(state.cart).reduce((total, itemQuantity) => total + itemQuantity, 0);
  const status = document.querySelector("#checkoutStatus");
  if (!quantity) {
    status.textContent = "Add at least one product before starting checkout.";
    return;
  }
  status.textContent =
    "USD checkout placeholder: next production step is creating a server-side checkout session and redirecting the reader to the hosted payment page.";
});

renderAll();
