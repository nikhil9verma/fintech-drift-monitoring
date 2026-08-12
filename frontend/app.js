/* ══════════════════════════════════════════════════════════
   FinTech AI — app.js
   Backend: https://fintech-drift-monitoring.onrender.com
   Pages: Dashboard | Credit | Churn | Lead | Compliance Q&A
══════════════════════════════════════════════════════════ */

// When deploying to Render and Vercel separately:
// 1. Deploy the backend to Render.
// 2. Update BACKEND to your Render URL here (e.g., "https://your-app.onrender.com").
// 3. Deploy the frontend folder to Vercel.
// Automatically use Render backend when deployed to Vercel, else use local relative path.
const BACKEND = window.location.hostname.includes("vercel.app")
    ? "https://fintech-drift-monitoring.onrender.com"
    : "";

/* ─── NAVIGATION ────────────────────────────────────────── */
document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const page = link.dataset.page;
        document.querySelectorAll(".nav-item").forEach(l => l.classList.remove("active"));
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        link.classList.add("active");
        document.getElementById(`page-${page}`).classList.add("active");
    });
});

/* ─── API FETCH WRAPPER (Handles Cold Starts) ────────────── */
async function apiFetch(url, options = {}, retries = 10) {
    try {
        const res = await fetch(url, options);
        if ((res.status === 502 || res.status === 503) && retries > 0) {
            console.log("Server waking up, retrying...");
            await new Promise(r => setTimeout(r, 5000));
            return apiFetch(url, options, retries - 1);
        }
        return res;
    } catch (err) {
        if ((err.name === "TypeError" || err.message.includes("fetch")) && retries > 0) {
            console.log("Network error (cold start), retrying...");
            await new Promise(r => setTimeout(r, 5000));
            return apiFetch(url, options, retries - 1);
        }
        throw err;
    }
}

/* ─── WAKE UP SERVER ────────────────────────────────────── */
if (BACKEND) {
    // Fire a lightweight request to wake up Render on page load
    fetch(`${BACKEND}/api/predict-churn`, { method: "POST", headers:{"Content-Type":"application/json"}, body:"{}" }).catch(()=>{});
}

/* ─── GLOBAL LOADER ─────────────────────────────────────── */
let loaderTimeoutId = null;

function showLoader(btn, text) {
    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-circle-notch ph-spin"></i> ${text}`;
    
    loaderTimeoutId = setTimeout(() => {
        btn.innerHTML = `<i class="ph ph-circle-notch ph-spin"></i> Waking up server (can take 50s)...`;
    }, 4000);
}

function hideLoader(btn, icon, text) {
    if (loaderTimeoutId) clearTimeout(loaderTimeoutId);
    btn.disabled = false;
    btn.innerHTML = `<i class="ph ${icon}"></i> ${text}`;
}

/* ─── DASHBOARD CHARTS ───────────────────────────────────── */
const ctxVol = document.getElementById("volumeChart")?.getContext("2d");
if (ctxVol) {
    const grad = ctxVol.createLinearGradient(0, 0, 0, 280);
    grad.addColorStop(0, "rgba(14,165,233,.22)");
    grad.addColorStop(1, "rgba(14,165,233,0)");
    new Chart(ctxVol, {
        type: "line",
        data: {
            labels: ["9AM","10AM","11AM","12PM","1PM","2PM","3PM"],
            datasets: [
                { label:"Assessments", data:[12,18,25,23,28,27,34], borderColor:"#0ea5e9", backgroundColor:grad, borderWidth:2, tension:.4, fill:true, pointRadius:0 },
                { label:"Fraud",       data:[2,1,3,4,3,1,5],         borderColor:"#ef4444", backgroundColor:"transparent", borderWidth:2, tension:.4, fill:false, pointRadius:0 }
            ]
        },
        options: lineOpts({ min:0, max:36, stepSize:9 })
    });
}

const ctxRisk = document.getElementById("riskChart")?.getContext("2d");
if (ctxRisk) {
    new Chart(ctxRisk, {
        type: "doughnut",
        data: {
            labels: ["Low","Medium","High","Critical"],
            datasets: [{ data:[142,67,38,11], backgroundColor:["#10b981","#f59e0b","#f97316","#ef4444"], borderWidth:0, hoverOffset:4 }]
        },
        options: { responsive:true, maintainAspectRatio:false, cutout:"73%",
            plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"#131824", titleColor:"#f8fafc", bodyColor:"#8b96a5", borderColor:"rgba(255,255,255,.1)", borderWidth:1 } }
        }
    });
}

/* ─── SHARED FORM FIELDS ─────────────────────────────────── */
const SHARED_FIELDS = {
    CreditScore:     { id:"CreditScore",     label:"Credit Score",        type:"number", placeholder:"300–900",  min:300, max:900, defaultValue: 650 },
    Age:             { id:"Age",             label:"Age",                 type:"number", placeholder:"18–100",   min:18,  max:100, defaultValue: 35 },
    Geography:       { id:"Geography",       label:"Region",              type:"select", options:["France","Germany","Spain"] },
    Gender:          { id:"Gender",          label:"Gender",              type:"select", options:["Male","Female"] },
    Tenure:          { id:"Tenure",          label:"Tenure (years)",      type:"number", placeholder:"0–100",    min:0,   max:100, defaultValue: 5 },
    Balance:         { id:"Balance",         label:"Account Balance (₹)", type:"number", placeholder:"e.g. 120000", min:0, defaultValue: 50000 },
    NumOfProducts:   { id:"NumOfProducts",   label:"No. of Products",     type:"number", placeholder:"1–4",      min:1,   max:4, defaultValue: 1 },
    EstimatedSalary: { id:"EstimatedSalary", label:"Estimated Salary (₹)",type:"number", placeholder:"e.g. 85000", min:0, defaultValue: 60000 },
    HasCrCard:       { id:"HasCrCard",       label:"Has Credit Card?",    type:"select", options:["Yes","No"] },
    IsActiveMember:  { id:"IsActiveMember",  label:"Active Member?",      type:"select", options:["Yes","No"] },
};

const CREDIT_FIELDS = [
    SHARED_FIELDS.CreditScore,
    SHARED_FIELDS.Balance,
    SHARED_FIELDS.NumOfProducts,
    SHARED_FIELDS.EstimatedSalary,
    SHARED_FIELDS.HasCrCard
];

const CHURN_FIELDS = [
    SHARED_FIELDS.CreditScore,
    SHARED_FIELDS.Age,
    SHARED_FIELDS.Geography,
    SHARED_FIELDS.Gender,
    SHARED_FIELDS.Balance,
    SHARED_FIELDS.NumOfProducts,
    SHARED_FIELDS.IsActiveMember
];

const LEAD_FIELDS = [
    SHARED_FIELDS.CreditScore,
    SHARED_FIELDS.Tenure,
    SHARED_FIELDS.Balance,
    SHARED_FIELDS.EstimatedSalary,
    SHARED_FIELDS.IsActiveMember
];

function renderForm(containerId, fields) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = fields.map(f => {
        const fid = `${containerId}-${f.id}`;
        if (f.type === "select") {
            return `<div class="form-field">
                <label for="${fid}">${f.label}</label>
                <select id="${fid}">
                    ${f.options.map(o => `<option value="${o}">${o}</option>`).join("")}
                </select>
            </div>`;
        }
        return `<div class="form-field">
            <label for="${fid}">${f.label}</label>
            <input id="${fid}" type="number" placeholder="${f.placeholder || ""}"
                ${f.min != null ? `min="${f.min}"` : ""} ${f.max != null ? `max="${f.max}"` : ""}
                ${f.defaultValue != null ? `value="${f.defaultValue}"` : ""} />
        </div>`;
    }).join("");
}

function readForm(containerId, fields) {
    const payload = {};
    let missing = [];
    let invalid = [];

    fields.forEach(f => {
        const el = document.getElementById(`${containerId}-${f.id}`);
        if (!el) return;
        
        if (f.type === "select") {
            if (f.id === "HasCrCard" || f.id === "IsActiveMember") {
                payload[f.id] = el.value === "Yes" ? 1 : 0;
            } else {
                payload[f.id] = el.value;
            }
        } else {
            if (el.value.trim() === "") {
                missing.push(f.label);
            } else {
                const val = parseFloat(el.value);
                if (f.min !== undefined && val < f.min) {
                    invalid.push(`${f.label} must be at least ${f.min}`);
                }
                if (f.max !== undefined && val > f.max) {
                    invalid.push(`${f.label} must be at most ${f.max}`);
                }
                payload[f.id] = val;
            }
        }
    });

    if (missing.length > 0) {
        alert(`Please fill in the following fields:\n- ${missing.join("\n- ")}`);
        return null;
    }
    
    if (invalid.length > 0) {
        alert(`Invalid values detected:\n- ${invalid.join("\n- ")}`);
        return null;
    }

    return payload;
}

/* ─── SCORE RING ANIMATION ───────────────────────────────── */
// Circumference of r=50 circle = 2*PI*50 ≈ 314.16
function animateRing(ringId, pct, color) {
    const ring = document.getElementById(ringId);
    if (!ring) return;
    const circum = 314;
    const offset = circum - (pct / 100) * circum;
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = color;
}

function riskColor(pct) {
    if (pct < 30) return "#10b981";
    if (pct < 60) return "#f59e0b";
    return "#ef4444";
}

function riskLabel(pct) {
    if (pct < 30) return ["LOW RISK", "verdict-low"];
    if (pct < 60) return ["MEDIUM RISK", "verdict-med"];
    return ["HIGH RISK", "verdict-high"];
}

/* ─── CREDIT ASSESSMENT ──────────────────────────────────── */
renderForm("credit-form", CREDIT_FIELDS);
document.getElementById("btn-credit-predict")?.addEventListener("click", async () => {
    const payload = readForm("credit-form", CREDIT_FIELDS);
    if (!payload) return;
    const btn = document.getElementById("btn-credit-predict");
    showLoader(btn, "Calculating…");

    try {
        const res  = await apiFetch(`${BACKEND}/api/predict-credit`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error");

        const score = Math.round(data.credit_score);
        const pct   = score; // score is already 0-100
        const color = riskColor(100 - pct); // higher score = better = green
        const [label, cls] = score >= 70 ? ["GOOD HEALTH","verdict-low"] : score >= 40 ? ["MODERATE","verdict-med"] : ["POOR HEALTH","verdict-high"];

        document.getElementById("credit-score-val").textContent = score;
        animateRing("credit-ring-fill", pct, score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444");

        const verdict = document.getElementById("credit-verdict");
        verdict.textContent = label;
        verdict.className = `result-verdict ${cls}`;

        document.getElementById("credit-empty").style.display = "none";
        document.getElementById("credit-result").style.display = "flex";
    } catch(e) {
        alert("Error: " + e.message);
    } finally {
        hideLoader(btn, "ph-lightning", "Run Credit Assessment");
    }
});

/* ─── CHURN PREDICTION ───────────────────────────────────── */
renderForm("churn-form", CHURN_FIELDS);
document.getElementById("btn-churn-predict")?.addEventListener("click", async () => {
    const payload = readForm("churn-form", CHURN_FIELDS);
    if (!payload) return;
    const btn = document.getElementById("btn-churn-predict");
    showLoader(btn, "Predicting…");

    try {
        const res  = await apiFetch(`${BACKEND}/api/predict-churn`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error");

        const pct = Math.round(data.churn_probability * 100);
        const [label, cls] = riskLabel(pct);

        document.getElementById("churn-prob-val").textContent = pct + "%";
        animateRing("churn-ring-fill", pct, riskColor(pct));

        const verdict = document.getElementById("churn-verdict");
        verdict.textContent = label;
        verdict.className = `result-verdict ${cls}`;

        document.getElementById("churn-empty").style.display = "none";
        document.getElementById("churn-result").style.display = "flex";
    } catch(e) {
        alert("Error: " + e.message);
    } finally {
        hideLoader(btn, "ph-lightning", "Predict Churn");
    }
});

/* ─── LEAD SCORING ───────────────────────────────────────── */
renderForm("lead-form", LEAD_FIELDS);
document.getElementById("btn-lead-predict")?.addEventListener("click", async () => {
    const payload = readForm("lead-form", LEAD_FIELDS);
    if (!payload) return;
    const btn = document.getElementById("btn-lead-predict");
    showLoader(btn, "Scoring…");

    try {
        const res  = await apiFetch(`${BACKEND}/api/predict-loan`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error");

        const pct = Math.round(data.loan_probability * 100);
        // For loan: higher % = better = green
        const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
        const [label, cls] = pct >= 70 ? ["LIKELY APPROVED","verdict-low"] : pct >= 40 ? ["REVIEW NEEDED","verdict-med"] : ["LIKELY REJECTED","verdict-high"];

        document.getElementById("lead-prob-val").textContent = pct + "%";
        animateRing("lead-ring-fill", pct, color);

        const verdict = document.getElementById("lead-verdict");
        verdict.textContent = label;
        verdict.className = `result-verdict ${cls}`;

        document.getElementById("lead-empty").style.display = "none";
        document.getElementById("lead-result").style.display = "flex";
    } catch(e) {
        alert("Error: " + e.message);
    } finally {
        hideLoader(btn, "ph-lightning", "Score Lead");
    }
});

/* ─── COMPLIANCE Q&A (RAG) ───────────────────────────────── */
const chatWindow  = document.getElementById("chat-window");
const chatInput   = document.getElementById("compliance-query");
const chatSendBtn = document.getElementById("btn-compliance-send");

function appendMsg(content, isUser, sources = []) {
    // Remove welcome placeholder on first message
    const welcome = chatWindow.querySelector(".chat-welcome");
    if (welcome) welcome.remove();

    const wrapper = document.createElement("div");
    wrapper.className = `msg ${isUser ? "user-msg" : "bot-msg"}`;

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = isUser ? `<i class="ph ph-user"></i>` : `<i class="ph ph-robot"></i>`;

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = content;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatWindow.appendChild(wrapper);

    // Render sources
    if (!isUser && sources.length > 0) {
        const srcDiv = document.createElement("div");
        srcDiv.className = "msg-sources";
        srcDiv.innerHTML = `<div class="sources-label">SOURCES</div>` +
            sources.map((s, i) => {
                const meta = s.meta || {};
                const label = meta.section || meta.title || `Document ${i+1}`;
                return `<span class="source-chip">${label}</span>`;
            }).join("");
        chatWindow.appendChild(srcDiv);
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
}

let typingTimeoutId = null;
function showTyping() {
    const div = document.createElement("div");
    div.className = "msg bot-msg";
    div.id = "typing-indicator";
    div.innerHTML = `<div class="msg-avatar"><i class="ph ph-robot"></i></div>
        <div class="msg-bubble msg-typing" id="typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    typingTimeoutId = setTimeout(() => {
        const bubble = document.getElementById("typing-bubble");
        if (bubble) bubble.innerHTML = `<span style="font-size: 0.85em; opacity: 0.8">Waking up server (can take 50s)...</span>`;
    }, 4000);
}

function removeTyping() {
    if (typingTimeoutId) clearTimeout(typingTimeoutId);
    document.getElementById("typing-indicator")?.remove();
}

async function sendCompliance() {
    const query = chatInput.value.trim();
    if (!query) return;

    chatInput.value = "";
    appendMsg(query, true);
    chatSendBtn.disabled = true;
    showTyping();

    try {
        const res  = await apiFetch(`${BACKEND}/api/qa`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({ query })
        });
        const data = await res.json();
        removeTyping();
        if (!res.ok) throw new Error(data.detail || "Error from server");
        appendMsg(data.answer, false, data.sources || []);
    } catch(e) {
        removeTyping();
        appendMsg(`⚠️ ${e.message}`, false);
    } finally {
        chatSendBtn.disabled = false;
        chatInput.focus();
    }
}

chatSendBtn?.addEventListener("click", sendCompliance);
chatInput?.addEventListener("keydown", e => { if (e.key === "Enter") sendCompliance(); });

/* ─── HELPERS ────────────────────────────────────────────── */
function lineOpts({ min, max, stepSize }) {
    return {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"#131824", titleColor:"#f8fafc", bodyColor:"#8b96a5", borderColor:"rgba(255,255,255,.1)", borderWidth:1, mode:"index", intersect:false } },
        scales:{
            x:{ grid:{display:false}, ticks:{color:"#8b96a5",font:{size:11}} },
            y:{ min, max, grid:{color:"rgba(255,255,255,.05)",borderDash:[4,4]}, ticks:{color:"#8b96a5",stepSize,font:{size:11}} }
        }
    };
}
