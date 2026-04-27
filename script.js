const OPEN_DATE = new Date("2026-04-28T00:00:00");
const CLOSE_DATE = new Date("2026-05-02T23:59:59");
const TOTAL_POINTS = 30;
const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxZosDaXXVMfxpHj__kOQ_BZDOYq8-aQJTtFg991zzRk8OoYjeuLf3s00z7aFqBitWVcQ/exec";

let assignmentStartTime = Date.now();
let focusLossCount = 0;
let copyPasteCount = 0;
let fullscreenExitCount = 0;
let securityEvents = [];
let lastBlurAt = 0;
let isLocked = false;
const UNLOCK_CODE = "248195";
let ignoreSecurityUntil = 0;

function recordSecurityEvent(type, details = "") {
  const time = new Date().toLocaleString("he-IL");
  securityEvents.push(`${time} - ${type}${details ? ": " + details : ""}`);
  updateSecurityPanel();
}

function updateSecurityPanel() {
  const panel = document.getElementById("securityPanel");
  if (!panel) return;

  const totalWarnings = focusLossCount + copyPasteCount + fullscreenExitCount;
  const status = totalWarnings === 0 ? "תקין" : totalWarnings <= 2 ? "אזהרה" : "חשד להעתקה / יציאה מהמטלה";

  panel.innerHTML = `
    <strong>בקרת מטלה:</strong>
    <span>יציאות מהמסך: ${focusLossCount}</span>
    <span>ניסיונות העתקה/הדבקה: ${copyPasteCount}</span>
    <span>יציאות ממסך מלא: ${fullscreenExitCount}</span>
    <span>סטטוס: ${status}</span>
  `;
}

function lockAssignment(reason) {
  recordSecurityEvent("חריגה שנרשמה", reason);
  showSecurityWarning(reason + " האירוע נרשם בטבלת ההגשות, אך ניתן להמשיך במטלה.");
}

function unlockAssignment() {
  document.getElementById("lockOverlay")?.classList.add("hidden");
  showSecurityWarning("אין נעילה בגרסה הביתית. ניתן להמשיך במטלה.");
  return true;
}

function showSecurityWarning(message) {
  const warning = document.getElementById("securityWarning");
  if (!warning) return;
  warning.textContent = message;
  warning.classList.remove("hidden");
  setTimeout(() => warning.classList.add("hidden"), 5500);
}

function setupSecurityControls() {
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", async () => {
      try {
        await document.documentElement.requestFullscreen();
        recordSecurityEvent("כניסה למסך מלא");
      } catch (error) {
        showSecurityWarning("הדפדפן לא אישר מעבר למסך מלא. אפשר להמשיך, אך מומלץ לעבוד במסך מלא.");
      }
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && Date.now() >= ignoreSecurityUntil) {
      focusLossCount++;
      recordSecurityEvent("יציאה מהמסך / מעבר ללשונית אחרת");
      lockAssignment("המערכת זיהתה מעבר ללשונית אחרת או יציאה מהמסך.");
    }
  });

  window.addEventListener("blur", () => {
    const now = Date.now();
    if (now - lastBlurAt > 1500 && Date.now() >= ignoreSecurityUntil) {
      lastBlurAt = now;
      focusLossCount++;
      recordSecurityEvent("אובדן מיקוד חלון");
      lockAssignment("המערכת זיהתה יציאה מחלון המטלה.");
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && !isLocked && Date.now() >= ignoreSecurityUntil) {
      fullscreenExitCount++;
      recordSecurityEvent("יציאה ממסך מלא");
      lockAssignment("המערכת זיהתה יציאה ממצב מסך מלא.");
    }
  });

  ["copy", "cut", "paste"].forEach(eventName => {
    document.addEventListener(eventName, event => {
      copyPasteCount++;
      recordSecurityEvent(`ניסיון ${eventName}`);
      lockAssignment("המערכת זיהתה ניסיון העתקה / גזירה / הדבקה.");
      event.preventDefault();
    });
  });

  document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if (event.key === "PrintScreen") {
      copyPasteCount++;
      recordSecurityEvent("ניסיון צילום מסך / PrintScreen");
      lockAssignment("המערכת זיהתה ניסיון צילום מסך.");
      event.preventDefault();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && ["c", "v", "x", "p", "s", "a"].includes(key)) {
      copyPasteCount++;
      recordSecurityEvent(`קיצור מקשים חשוד: ${event.key}`);
      lockAssignment("המערכת זיהתה קיצור מקשים שאינו מותר בזמן המטלה.");
      event.preventDefault();
    }
  });

  document.getElementById("unlockBtn")?.addEventListener("click", unlockAssignment);
  document.getElementById("unlockCodeInput")?.addEventListener("keydown", event => {
    if (event.key === "Enter") unlockAssignment();
  });

  updateSecurityPanel();
}

const questions = [
  { section: "שאלות איתור מידע" },
  {
    id: "q1",
    type: "text",
    points: 2,
    title: "1. על פי פסקה א, אילו שני סימנים לשינוי סביבתי מתאר פרידמן?",
    keywords: [["שדה", "השדה", "לא קיים", "כבר לא קיים", "אקלים משתנה", "האקלים משתנה", "שינוי אקלים"], ["זחלים", "לא רואה", "לא רואה זחלים", "בעלי חיים", "נכחדים", "נכחד", "היעלמות", "נעלמים", "חיות"]],
    answer: "תשובות אפשריות: השדה כבר לא קיים; הוא כבר לא רואה זחלים; בעלי חיים נכחדים; האקלים משתנה לנגד עיניו; יש סימנים מדאיגים למשבר האקלים."
  },
  {
    id: "q2",
    type: "text",
    points: 3,
    title: "2. ציינו על פי פסקה ב, שתי השפעות נפשיות שעלולות להיגרם בעקבות משבר האקלים.",
    keywordsAnyCount: 2,
    keywordsAny: ["פחד", "כעס", "דיכאון", "דאגה", "יגון"],
    answer: "יש לקבל שתיים מתוך: פחד, כעס, דיכאון, דאגה, יגון אקלים."
  },
  {
    id: "q3",
    type: "text",
    points: 3,
    title: "3. על פי פסקה ג, מה עשתה גרטה תונברג כדי לקדם פעולה נגד משבר האקלים? ציינו שתי פעולות או תוצאות.",
    keywords: [["הפסיקה ללמוד", "בית הספר"], ["להקשיב למדע", "מנהיג", "סחפה", "מחאה", "לפעול"]],
    answer: "הפסיקה ללמוד כדי לעסוק במשבר האקלים, קראה למנהיגי העולם להקשיב למדע ולפעול, וסחפה אחריה אנשים למחאה."
  },
  { section: "שאלות יישום" },
  {
    id: "q4",
    type: "fill",
    points: 5,
    title: "4. קראו את הקטע הקצר וענו: יש בני נוער שמרגישים כי בעיות עולמיות גדולות מדי בשבילם. הם טוענים שאין להם השפעה אמיתית על החלטות של ממשלות, ולכן הם מעדיפים לא להשתתף במחאות.",
    prompt: "לפי הקטע הקצר, חלק מבני הנוער מרגישים ________. לעומת זאת, על פי פסקה ה במאמר, מאיה ונובל מאמינות שהפחד צריך לגרום ל ________ ושיש לבני הנוער ________.",
    blanks: [
      { label: "חלק מבני הנוער מרגישים", keywords: ["חוסר אונים", "אין השפעה", "חוסר השפעה", "אין להם השפעה"] },
      { label: "הפחד צריך לגרום ל", keywords: ["פעולה", "לפעול"] },
      { label: "שיש לבני הנוער", keywords: ["כוח", "לשנות", "להשפיע", "לפעול", "יכולת"] }
    ],
    answer: "חוסר אונים / אין השפעה; פעולה; כוח לשנות / להשפיע / לפעול."
  },
  {
    id: "q5",
    type: "fill",
    points: 4,
    title: "5. קראו את הקטע הקצר וענו: יש אנשים הסבורים שמחאות תלמידים פוגעות בלמידה, מפני שהתלמידים אינם מגיעים לכיתות ומפסידים חומר לימודי.",
    prompt: "על פי הקטע הקצר, חלק מהאנשים חושבים שמחאות תלמידים פוגעות ב ________. לעומת זאת, על פי פסקה ד במאמר, התלמידים שבתו כדי להעלות את ________.",
    blanks: [
      { label: "מחאות תלמידים פוגעות ב", keywords: ["למידה", "הלמידה", "לימודים", "הלימודים", "חומר לימודי", "החומר הלימודי", "מפסידים חומר", "הפסד חומר", "לא מגיעים לכיתות", "כיתות", "שיעורים"] },
      { label: "התלמידים שבתו כדי להעלות את", keywords: ["מודעות", "המודעות", "משבר האקלים", "למשבר האקלים", "מודעות למשבר האקלים", "המודעות למשבר האקלים", "להעלות מודעות"] }
    ],
    answer: "תשובות אפשריות: למידה / לימודים / חומר לימודי / שיעורים / הגעה לכיתות; מודעות / מודעות למשבר האקלים."
  },
  { section: "שאלות הבנה והסקת מסקנות" },
  {
    id: "q6",
    type: "choice",
    points: 2,
    title: "6. מהו הרעיון המרכזי של פסקה ו?",
    options: [
      "דור ה־Z מאמין בפעולה, בשינוי ובעוררות תקווה.",
      "דור ה־Y אינו מכיר במשבר האקלים.",
      "המחאה בישראל נכשלה ולא השפיעה.",
      "משבר האקלים אינו קשור לבני נוער."
    ],
    correct: 0
  },
  {
    id: "q7",
    type: "choice",
    points: 2,
    title: "7. מדוע בני דור ה־Z יוצאים למחאה, על פי פסקאות ד–ה?",
    options: [
      "כדי לבטל את כל השיעורים בבית הספר.",
      "כדי להעלות מודעות למשבר האקלים ולדרוש פעולה.",
      "כדי להוכיח שאין שינוי באקלים.",
      "כדי להיפגש עם מנהיגי העולם בלבד."
    ],
    correct: 1
  },
  { section: "שאלות על משמעות של מילים, צירופים ומאזכרים" },
  {
    id: "q8",
    type: "choice",
    points: 2,
    title: "8. בפסקה ב כתוב: ״Climate Grief, יגון האקלים״. למה הכוונה בצירוף ״יגון האקלים״?",
    options: [
      "שמחה בעקבות מזג אוויר נעים.",
      "תחושת פחד, עצב ודאגה בעקבות משבר האקלים.",
      "שם של ארגון סביבתי.",
      "פעילות ספורטיבית בטבע."
    ],
    correct: 1
  },
  {
    id: "q9",
    type: "choice",
    points: 2,
    title: "9. בפסקה ד כתוב: ״כדי להעלות את המודעות למשבר האקלים״. למה הכוונה במילה ״מודעות״?",
    options: [
      "ידיעה והבנה של הבעיה.",
      "התעלמות מן הבעיה.",
      "שיעור בבית הספר בלבד.",
      "תחושת עייפות."
    ],
    correct: 0
  },
  {
    id: "q10",
    type: "choice",
    points: 2,
    title: "10. בפסקה ג כתוב: ״היא הפסיקה ללמוד בבית הספר״. למי הכוונה במילה ״היא״?",
    options: [
      "מאיה גנאים",
      "גרטה תונברג",
      "יעל וענבל",
      "האגודה האמריקאית"
    ],
    correct: 1
  },
  { section: "11. מילות קישור" },
  {
    id: "q11a",
    type: "choice",
    points: 1,
    title: "11.1 משבר האקלים משפיע על בני נוער, משום שהוא מעורר פחד ודאגה. בחרו מילת קישור מתאימה:",
    options: ["מפני ש", "למרות ש", "אחרי ש", "משום כך"],
    correct: 0
  },
  {
    id: "q11b",
    type: "choice",
    points: 1,
    title: "11.2 בני נוער יוצאים למחאה בשביל להעלות מודעות למשבר האקלים. בחרו מילת קישור מתאימה:",
    options: ["כמו", "כדי", "אולם", "למרות"],
    correct: 1
  },
  {
    id: "q11c",
    type: "choice",
    points: 1,
    title: "11.3 דור ה־Y מרגיש חוסר אונים, _________ דור ה־Z מאמין שאפשר לשנות את המצב.",
    options: ["אם", "בגלל", "או", "אבל"],
    correct: 3
  }
];

function includesAny(text, arr) {
  return arr.some(k => text.includes(k));
}

function gradeTextAnswer(answer, q) {
  const text = (answer || "").trim().toLowerCase();
  if (!text) return 0;

  if (q.keywordsAny) {
    const found = q.keywordsAny.filter(k => text.includes(k.toLowerCase()));
    return Math.min(q.points, (found.length / q.keywordsAnyCount) * q.points);
  }

  if (q.keywords) {
    let groupsFound = 0;
    q.keywords.forEach(group => {
      if (includesAny(text, group.map(k => k.toLowerCase()))) groupsFound++;
    });
    return (groupsFound / q.keywords.length) * q.points;
  }

  return 0;
}

function gradeFillAnswer(q) {
  let earned = 0;
  const perBlank = q.points / q.blanks.length;

  q.blanks.forEach((blank, idx) => {
    const value = (document.querySelector(`[name="${q.id}_${idx}"]`)?.value || "").toLowerCase();
    if (includesAny(value, blank.keywords.map(k => k.toLowerCase()))) {
      earned += perBlank;
    }
  });

  return earned;
}


function highlightInstructionWords(text) {
  if (!text) return "";

  return text
    .replaceAll("פסקאות ד – ה", '<span class="highlight-paragraph-range">פסקאות ד – ה</span>')
    .replaceAll("פסקאות ד - ה", '<span class="highlight-paragraph-range">פסקאות ד - ה</span>')
    .replaceAll("פסקאות ד–ה", '<span class="highlight-paragraph-range">פסקאות ד–ה</span>')
    .replaceAll("על פי הקטע הקצר", '<span class="highlight-source">על פי הקטע הקצר</span>')
    .replaceAll("לפי הקטע הקצר", '<span class="highlight-source">לפי הקטע הקצר</span>')
    .replaceAll("הקטע הקצר", '<span class="highlight-short-text">הקטע הקצר</span>')
    .replaceAll("על פי פסקה א", '<span class="highlight-paragraph-a">על פי פסקה א</span>')
    .replaceAll("פסקה א", '<span class="highlight-paragraph-a">פסקה א</span>')
    .replaceAll("על פי פסקה ב", '<span class="highlight-paragraph-b">על פי פסקה ב</span>')
    .replaceAll("בפסקה ב", '<span class="highlight-paragraph-b">בפסקה ב</span>')
    .replaceAll("פסקה ב", '<span class="highlight-paragraph-b">פסקה ב</span>')
    .replaceAll("על פי פסקה ג", '<span class="highlight-paragraph-c">על פי פסקה ג</span>')
    .replaceAll("בפסקה ג", '<span class="highlight-paragraph-c">בפסקה ג</span>')
    .replaceAll("פסקה ג", '<span class="highlight-paragraph-c">פסקה ג</span>')
    .replaceAll("על פי פסקה ד", '<span class="highlight-paragraph-d">על פי פסקה ד</span>')
    .replaceAll("פסקה ד", '<span class="highlight-paragraph-d">פסקה ד</span>')
    .replaceAll("על פי פסקה ה", '<span class="highlight-paragraph-e">על פי פסקה ה</span>')
    .replaceAll("פסקה ה", '<span class="highlight-paragraph-e">פסקה ה</span>')
    .replaceAll("פסקה ו", '<span class="highlight-paragraph-vav">פסקה ו</span>')
    .replaceAll("משום ש", '<span class="highlight-causal">משום ש</span>')
    .replaceAll("שתי פעולות", '<span class="highlight-two">שתי</span> פעולות')
    .replaceAll("שתי השפעות", '<span class="highlight-two">שתי</span> השפעות');
}


const glossaryTerms = [
  { term: "משבר האקלים", meaning: "أزمة المناخ" },
  { term: "חסר אונים", meaning: "عاجز / لا حول له" },
  { term: "בריאות הנפש", meaning: "الصحة النفسية" },
  { term: "יגון האקלים", meaning: "حزن المناخ / القلق المناخي" },
  { term: "בשונה מ־", meaning: "بخلاف / على عكس" },
  { term: "להכיר במשבר", meaning: "الاعتراف بالأزمة" },
  { term: "להקשיב למדע", meaning: "الإصغاء للعلم" },
  { term: "שביתת תלמידים", meaning: "إضراب الطلاب" },
  { term: "להעלות את המודעות", meaning: "رفع الوعي" },
  { term: "לעורר תקווה", meaning: "بثّ الأمل" },
  { term: "נכחדים", meaning: "تنقرض" },
  { term: "דיכאון", meaning: "اكتئاب" },
  { term: "מחאה", meaning: "احتجاج" },
  { term: "יוזמה", meaning: "مبادرة" },
  { term: "להתעלם", meaning: "يتجاهل" }
];

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addGlossaryTooltips() {
  const article = document.querySelector(".text-card");
  if (!article || article.dataset.glossaryReady === "true") return;

  const paragraphs = article.querySelectorAll("p");
  paragraphs.forEach(p => {
    let html = p.innerHTML;

    glossaryTerms.forEach(item => {
      const safeTerm = escapeRegExp(item.term);
      const regex = new RegExp(`(?<![">])(${safeTerm})(?![^<]*>|[^<>]*</span>)`, "g");
      html = html.replace(regex, `<span class="glossary-word" tabindex="0" data-meaning="${item.meaning}">$1</span>`);
    });

    p.innerHTML = html;
  });

  article.dataset.glossaryReady = "true";
}

function renderQuestions() {
  const wrapper = document.getElementById("questions");
  let activeSection = "";

  questions.forEach(q => {
    if (q.section) {
      activeSection = q.section;
      return;
    }

    const div = document.createElement("div");
    div.className = "question question-page hidden";
    div.dataset.questionId = q.id;

    let html = "";
    if (activeSection) {
      html += `<div class="section-title in-question">${activeSection}</div>`;
    }

    html += `<div class="q-title">${highlightInstructionWords(q.title)} <span class="points">(${q.points} נק׳)</span></div>`;

    if (q.type === "text") {
      html += `<textarea name="${q.id}" placeholder="כתבו את התשובה כאן"></textarea>`;
    }

    if (q.type === "fill") {
      html += `<p>${highlightInstructionWords(q.prompt)}</p><div class="fill-row">`;
      q.blanks.forEach((blank, idx) => {
        html += `<label>${blank.label}<input type="text" name="${q.id}_${idx}" /></label>`;
      });
      html += `</div>`;
    }

    if (q.type === "choice") {
      html += `<div class="options">`;
      q.options.forEach((option, idx) => {
        html += `<label><input type="radio" name="${q.id}" value="${idx}" /> ${option}</label>`;
      });
      html += `</div>`;
    }

    div.innerHTML = html;
    wrapper.appendChild(div);
  });

  questionElements = Array.from(document.querySelectorAll(".question-page"));
  setupQuestionNavigation();
  showQuestionPage(0);
}

function setupQuestionNavigation() {
  document.getElementById("prevQuestionBtn")?.addEventListener("click", () => {
    showQuestionPage(currentQuestionPage - 1);
  });

  document.getElementById("nextQuestionBtn")?.addEventListener("click", () => {
    showQuestionPage(currentQuestionPage + 1);
  });
}

function showQuestionPage(index) {
  if (!questionElements.length) return;

  currentQuestionPage = Math.max(0, Math.min(index, questionElements.length - 1));

  questionElements.forEach((el, i) => {
    el.classList.toggle("hidden", i !== currentQuestionPage);
  });

  const progress = document.getElementById("questionProgress");
  if (progress) {
    progress.innerHTML = `
      <strong>שאלה ${currentQuestionPage + 1} מתוך ${questionElements.length}</strong>
      <div class="progress-bar"><span style="width:${((currentQuestionPage + 1) / questionElements.length) * 100}%"></span></div>
    `;
  }

  const prevBtn = document.getElementById("prevQuestionBtn");
  const nextBtn = document.getElementById("nextQuestionBtn");
  const submitBtn = document.getElementById("finalSubmitBtn");

  if (prevBtn) prevBtn.disabled = currentQuestionPage === 0;
  if (nextBtn) nextBtn.classList.toggle("hidden", currentQuestionPage === questionElements.length - 1);
  if (submitBtn) submitBtn.classList.toggle("hidden", currentQuestionPage !== questionElements.length - 1);

  updateQuestionMap();
  document.querySelector(".questions-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateQuestionMap() {
  const map = document.getElementById("questionMap");
  if (!map || !questionElements.length) return;

  map.innerHTML = questionElements.map((el, i) => {
    const qid = el.dataset.questionId;
    const q = questions.find(item => item.id === qid);
    let answered = false;

    if (q) {
      if (q.type === "choice") {
        answered = Boolean(document.querySelector(`[name="${q.id}"]:checked`));
      } else if (q.type === "text") {
        answered = Boolean((document.querySelector(`[name="${q.id}"]`)?.value || "").trim());
      } else if (q.type === "fill") {
        answered = q.blanks.some((blank, idx) => Boolean((document.querySelector(`[name="${q.id}_${idx}"]`)?.value || "").trim()));
      }
    }

    const classes = [
      "map-dot",
      i === currentQuestionPage ? "active" : "",
      answered ? "answered" : ""
    ].join(" ");

    return `<button type="button" class="${classes}" data-index="${i}" title="שאלה ${i + 1}">${i + 1}</button>`;
  }).join("");

  map.querySelectorAll(".map-dot").forEach(btn => {
    btn.addEventListener("click", () => showQuestionPage(Number(btn.dataset.index)));
  });
}

function setupInteractiveFeatures() {
  document.addEventListener("input", updateQuestionMap);
  document.addEventListener("change", updateQuestionMap);

  document.getElementById("toggleArticleBtn")?.addEventListener("click", () => {
    document.querySelector(".exam-layout")?.classList.toggle("article-collapsed");
  });

  document.getElementById("increaseTextBtn")?.addEventListener("click", () => {
    document.body.classList.add("large-text");
    document.body.classList.remove("small-text");
  });

  document.getElementById("decreaseTextBtn")?.addEventListener("click", () => {
    document.body.classList.add("small-text");
    document.body.classList.remove("large-text");
  });

  document.querySelectorAll(".text-card p").forEach(paragraph => {
    paragraph.addEventListener("click", () => {
      paragraph.classList.toggle("highlighted-paragraph");
    });
  });

  updateQuestionMap();
}

function checkAvailability() {
  const box = document.getElementById("availability");
  const now = new Date();

  if (now < OPEN_DATE) {
    box.textContent = "המטלה עדיין לא נפתחה. ניתן להגיש החל מתאריך 28/04/2026.";
  } else if (now > CLOSE_DATE) {
    box.textContent = "תאריך סגירת המטלה עבר: 02/05/2026. ניתן לצפות, אך יש לבדוק מול המורה אם ההגשה מתקבלת.";
  } else {
    box.textContent = "המטלה פתוחה להגשה כעת.";
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const submitBtn = document.getElementById("finalSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "שולח/ת את המטלה...";

  let score = 0;
  const review = [];
  const answersForSheet = {};

  questions.forEach(q => {
    if (q.section) return;

    let earned = 0;
    let studentAnswer = "";

    if (q.type === "choice") {
      const selected = document.querySelector(`[name="${q.id}"]:checked`);
      if (selected) {
        const selectedIndex = Number(selected.value);
        studentAnswer = q.options[selectedIndex];
        if (selectedIndex === q.correct) {
          earned = q.points;
        }
      }
    }

    if (q.type === "text") {
      const value = document.querySelector(`[name="${q.id}"]`)?.value || "";
      studentAnswer = value;
      earned = gradeTextAnswer(value, q);
    }

    if (q.type === "fill") {
      const fillAnswers = [];
      q.blanks.forEach((blank, idx) => {
        const value = document.querySelector(`[name="${q.id}_${idx}"]`)?.value || "";
        fillAnswers.push(`${blank.label}: ${value}`);
      });
      studentAnswer = fillAnswers.join(" | ");
      earned = gradeFillAnswer(q);
    }

    earned = Math.round(earned * 10) / 10;
    score += earned;

    answersForSheet[q.id] = studentAnswer;

    review.push({
      title: q.title,
      earned,
      points: q.points,
      studentAnswer,
      answer: q.answer || (q.options ? q.options[q.correct] : "")
    });
  });

  score = Math.round(score * 10) / 10;
  const percent = Math.round((score / TOTAL_POINTS) * 100);

  const payload = {
    studentName: document.getElementById("studentName").value || "",
    studentClass: document.getElementById("studentClass").value || "",
    teacherName: document.getElementById("teacherName").value || "",
    score: score,
    percent: percent,
    q1: answersForSheet.q1 || "",
    q2: answersForSheet.q2 || "",
    q3: answersForSheet.q3 || "",
    q4: answersForSheet.q4 || "",
    q5: answersForSheet.q5 || "",
    q6: answersForSheet.q6 || "",
    q7: answersForSheet.q7 || "",
    q8: answersForSheet.q8 || "",
    q9: answersForSheet.q9 || "",
    q10: answersForSheet.q10 || "",
    q11a: answersForSheet.q11a || "",
    q11b: answersForSheet.q11b || "",
    q11c: answersForSheet.q11c || "",
    focusLossCount: focusLossCount,
    copyPasteCount: copyPasteCount,
    fullscreenExitCount: fullscreenExitCount,
    elapsedMinutes: Math.round(((Date.now() - assignmentStartTime) / 60000) * 10) / 10,
    securityStatus: (focusLossCount + copyPasteCount + fullscreenExitCount) === 0 ? "תקין" : ((focusLossCount + copyPasteCount + fullscreenExitCount) <= 2 ? "אזהרה" : "חשד"),
    securityEvents: securityEvents.join(" || ")
  };

  let savedToSheet = false;
  let saveMessage = "";

  try {
    await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    savedToSheet = true;
    saveMessage = "ההגשה נשלחה לטבלת Google Sheets.";
  } catch (error) {
    savedToSheet = false;
    saveMessage = "אירעה בעיה בשליחת הנתונים לטבלה. מומלץ לצלם מסך של הציון והתשובות ולפנות למורה.";
  }

  const result = document.getElementById("result");

  result.classList.remove("hidden");
  result.innerHTML = `
    <h2>תוצאה</h2>
    <p class="score">ציון: ${score} מתוך ${TOTAL_POINTS} נקודות (${percent})</p>
    <p><strong>שם:</strong> ${payload.studentName || "לא הוזן"}</p>
    <p><strong>כיתה:</strong> ${payload.studentClass || "לא הוזנה"}</p>
    <p><strong>שם המורה:</strong> ${payload.teacherName || "לא הוזן"}</p>
    <p class="${savedToSheet ? "correct" : "wrong"}">${saveMessage}</p>
    <p><strong>בקרת מסך:</strong> יציאות מהמסך: ${payload.focusLossCount}, ניסיונות העתקה/הדבקה: ${payload.copyPasteCount}, יציאות ממסך מלא: ${payload.fullscreenExitCount}, סטטוס: ${payload.securityStatus}</p>
    <p class="notice">שימו לב: שאלות פתוחות וחצי־פתוחות נבדקות לפי מילות מפתח. מומלץ שהמורה תבדוק אותן לפני קביעת ציון סופי. בקרת המסך אינה חסימת העתקה מוחלטת אלא כלי התראה ורישום.</p>
    <h3>פירוט בדיקה</h3>
    ${review.map(item => {
      const cls = item.earned === item.points ? "correct" : item.earned > 0 ? "partial" : "wrong";
      return `<div class="review-item">
        <p><strong>${item.title}</strong></p>
        <p><strong>תשובת התלמיד/ה:</strong> ${item.studentAnswer || "לא נענתה"}</p>
        <p class="${cls}">ניקוד: ${item.earned}/${item.points}</p>
        <p><strong>תשובה מצופה:</strong> ${item.answer}</p>
      </div>`;
    }).join("")}
  `;

  submitBtn.disabled = false;
  submitBtn.textContent = "שליחה סופית, שמירת התשובות וחישוב ציון";

  result.scrollIntoView({ behavior: "smooth" });
}

renderQuestions();
addGlossaryTooltips();
checkAvailability();
setupSecurityControls();
setupInteractiveFeatures();
document.getElementById("assignmentForm").addEventListener("submit", handleSubmit);

window.unlockAssignment = unlockAssignment;
