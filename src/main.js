const SYDNEY = 'Australia/Sydney';
const DHAKA = 'Asia/Dhaka' ;

function getTime(zone) {
    return new Intl.DateTimeFormat('en-GB' , {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).format(new Date());
    
} 

function getOffset(zone, date) {
    const parts = new Intl.DateTimeFormat('en-US' , {
        timeZone: zone,
        timeZoneName: 'longOffset' , 
    }).formatToParts(date);
    const name = parts.find(p => p.type === 'timeZoneName').value;
    const match = name.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;
    const minutes = Number(match[2]) * 60 + Number(match[3]);
    return match[1] === '-' ? - minutes : minutes;
    
}

function isDST(zone) {
    const year = new Date().getFullYear();
    const jan = getOffset(zone, new Date(year, 0 , 1));
    const jul = getOffset(zone, new Date(year, 6, 1));
    const now = getOffset(zone, new Date());
    return jan !== jul && now === Math.max(jan,jul);

}

function updateClocks() {
  const now = new Date();

  document.getElementById('sydneytime').textContent = getTime(SYDNEY);
  document.getElementById('dhakatime').textContent = getTime(DHAKA);
  document.getElementById('sydneydst').textContent = isDST(SYDNEY) ? 'DST: On' : 'DST: Off';
  document.getElementById('dhakadst').textContent = isDST(DHAKA) ? 'DST: On' : 'DST: Off';

  const diff = (getOffset(SYDNEY, now) - getOffset(DHAKA, now)) / 60;
  document.getElementById('clockdiff').textContent =
    `Sydney is ${Math.abs(diff)}h ${diff >= 0 ? 'ahead of' : 'behind'} Dhaka`;
}

updateClocks();
setInterval(updateClocks, 1000);

const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14));

function getMoonAge(date) {
    const daysSince = (date - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
    return ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

}

function getPhaseName(age) {
  if (age < 1.85) return "New Moon";
  if (age < 5.54) return "Waxing Crescent";
  if (age < 9.23) return "First Quarter";
  if (age < 12.92) return "Waxing Gibbous";
  if (age < 16.61) return "Full Moon";
  if (age < 20.30) return "Waning Gibbous";
  if (age < 23.99) return "Last Quarter";
  if (age < 27.68) return "Waning Crescent";
  return "New Moon";
}

function updateMoon() {
    const age = getMoonAge(new Date());
    document.getElementById("moonphase").textContent = getPhaseName(age);
    document.getElementById("moonage").textContent = `Age: ${age.toFixed(1)} days`;
    drawMoon(age);

}

function drawMoon(age) {
  const r = 45, cx = 50, cy = 50;
  const angle = 2 * Math.PI * age / SYNODIC_MONTH;
  const rx = r * Math.abs(Math.cos(angle));
  const litRight = age >= SYNODIC_MONTH / 2;
  const crescent = Math.cos(angle) > 0;
  const limbSweep = litRight ? 1 : 0;
  const termSweep = crescent ? 1 - limbSweep : limbSweep;
  const d = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${limbSweep} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${termSweep} ${cx} ${cy - r} Z`;
  document.getElementById("moonlit").setAttribute("d", d);
}


updateMoon();
setInterval(updateMoon, 60 * 60 * 1000); 

const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");
const input = document.getElementById("equation");

const xMin = -10, xMax = 10;
const yMin = -10, yMax = 10;

function toPixelX(x) {
  return (x - xMin) / (xMax - xMin) * canvas.width;
}

function toPixelY(y) {
  return canvas.height - (y - yMin) / (yMax - yMin) * canvas.height;
}

function drawAxes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";  
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = xMin; i <= xMax; i++) {
    ctx.moveTo(toPixelX(i), 0);
    ctx.lineTo(toPixelX(i), canvas.height);
  }
  for (let j = yMin; j <= yMax; j++) {
    ctx.moveTo(0, toPixelY(j));
    ctx.lineTo(canvas.width, toPixelY(j));
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";    
  ctx.beginPath();
  ctx.moveTo(toPixelX(0), 0);
  ctx.lineTo(toPixelX(0), canvas.height);
  ctx.moveTo(0, toPixelY(0));
  ctx.lineTo(canvas.width, toPixelY(0));
  ctx.stroke();
}

function makeFunction(text) {
  const cleaned = text
    .replace(/\^/g, "**")
    .replace(/(\d)([a-z(])/gi, "$1*$2");
  try {
    return new Function(
      "x",
      `const {sin, cos, tan, sqrt, abs, exp, PI, E} = Math;
       const ln = Math.log;
       return ${cleaned};`
    );
  } catch {
    return null;
  }
}

function plot(f) {
  ctx.strokeStyle = "#a8f0b8";
  ctx.lineWidth = 2;
  ctx.beginPath();

  let penDown = false;
  for (let px = 0; px <= canvas.width; px++) {
    const x = xMin + (px / canvas.width) * (xMax - xMin);

    let y;
    try {
      y = f(x);
    } catch {
      return;
    }

    if (!Number.isFinite(y)) {
      penDown = false;
      continue;
    }

    const py = toPixelY(y);
    if (penDown) {
      ctx.lineTo(px, py);
    } else {
      ctx.moveTo(px, py);
      penDown = true;
    }
  }
  ctx.stroke();
}

function redraw() {
  drawAxes();
  const f = makeFunction(input.value);
  if (f) plot(f);
}

input.addEventListener("input", redraw);
redraw();

const display = document.getElementById("display")
const buttons = document.querySelector(".calculator .buttons")

let justEvaluated = false;
let shiftmode = false;
let lastAnswer = "";

const OPERATORS = ["+", "−", "×", "÷", "^"];
const SWAP = {
  "SIN": "SIN^-1", "SIN^-1": "SIN",
  "COS": "COS^-1", "COS^-1": "COS",
  "TAN": "TAN^-1", "TAN^-1": "TAN",
  "8": "(", "(": "8",
  "9": ")", ")": "9",
  "x^y": "√", "√": "x^y",
};

const FUNC_NAME = {
  "SIN": "sin", "SIN^-1": "asin",
  "COS": "cos", "COS^-1": "acos",
  "TAN": "tan", "TAN^-1": "atan",
}; 

buttons.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  handle(btn.textContent.trim(), btn);
});

function handle(label, btn) {
  if (display.value === "Error") display.value = "";
  switch (label) {
    case "AC":
      display.value = "";
      justEvaluated = false;
      break;
    case "DEL":
      backspace();
      break;
    case "ANS":
      pressAnswer();
      break;
    case "2nd":
      toggleSecond(btn);
      break;
    case "=":
      evaluate();
      break;
    case "+": case "−": case "×": case "÷":
      pressOperator(label);
      break;
  case "x^y":
      pressOperator("^");
      break;
    case "(":
      pressFunction("");
      break;
    case ")":
      pressCloseBracket();
      break;
    case "√":
      pressFunction("√");
      break;
    default:
      if (label in FUNC_NAME) pressFunction(FUNC_NAME[label]);
      else pressInput(label);
  }
}

function pressCloseBracket() {
  const value = display.value;
  const open = (value.match(/\(/g) || []).length;
  const close = (value.match(/\)/g) || []).length;
  const last = value.slice(-1);

  if (open <= close) return;
  if (value === "" || last === "(" || OPERATORS.includes(last)) return;

  display.value += ")";
}

function pressInput(ch) {
  if (justEvaluated) {
    display.value = "";
    justEvaluated = false;
  }
  if (display.value.slice(-1) === ")") display.value += "×";
  if (ch === ".") {
    const currentNumber = display.value.split(/[+−×÷^(]/).pop();
    if (currentNumber.includes(".")) return;
  }
  display.value += ch;
}

function pressOperator(op) {
  justEvaluated = false;
  const value = display.value;

  if (value === "") {
    if (op === "−") display.value = "−";
    return;
  }
  if (value === "−") return;

  const last = value.slice(-1);
  if (last === "(") {
    if (op === "−") display.value += op;
    return;
  }
  if (OPERATORS.includes(last)) {
    display.value = value.slice(0, -1) + op;
  } else {
    display.value += op;
  }
}

function pressFunction(name) {
  if (justEvaluated) {
    display.value = "";
    justEvaluated = false;
  }
  if (/[\d.)]$/.test(display.value)) display.value += "×";
  display.value += name + "(";
}

function backspace() {
  display.value = display.value.replace(/(?:a?(?:sin|cos|tan)\(|√\(|.)$/, "");
}


function toggleSecond(btn) {
  shiftmode = !shiftmode;
  btn.classList.toggle("active", shiftmode);
  buttons.querySelectorAll("button").forEach((b) => {
    const label = b.textContent.trim();
    if (SWAP[label]) b.textContent = SWAP[label];
  });
}

function evaluate() {
  let expr = display.value;
  if (expr === "") return;

  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  expr += ")".repeat(Math.max(0, open - close));

  expr = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\^/g, "**")
    .replace(/√/g, "sqrt");

  try {
    const result = new Function(`
      const rad = (d) => d * Math.PI / 180;
      const deg = (r) => r * 180 / Math.PI;
      const sin = (d) => Math.sin(rad(d));
      const cos = (d) => Math.cos(rad(d));
      const tan = (d) => Math.tan(rad(d));
      const asin = (x) => deg(Math.asin(x));
      const acos = (x) => deg(Math.acos(x));
      const atan = (x) => deg(Math.atan(x));
      const sqrt = Math.sqrt;
      return ${expr};
    `)();

    if (!Number.isFinite(result)) throw new Error("bad result");
    display.value = String(parseFloat(result.toFixed(10))).replace("-", "−");
    lastAnswer = display.value;
  } catch {
    display.value = "Error";
  }
  justEvaluated = true;
}

const calculator = document.querySelector(".calculator");
let calculatorActive = false;

calculator.addEventListener("click", ()=> {
  calculatorActive = true;
  display.placeholder = "Type here";

});

document.addEventListener("click", (event) => {
  if (!calculator.contains(event.target)) {
    calculatorActive = false;
    display.placeholder = "";
  }
}); 

const KEY_MAP = {
  "+": "+", "-": "−", "*": "×", "x": "×", "/": "÷", "^": "x^y",
  "Enter": "=", "=": "=",
  "Backspace": "DEL",
  "Escape": "AC", "Delete": "AC",
  "s": "SIN", "c": "COS", "t": "TAN",
  "(": "(", ")": ")", "r": "√",
  "a":"ANS",
};

function findButton(label) {
  return [...buttons.querySelectorAll("button")].find(
   (b) => b.textContent.trim() === label
  
  );
  
}

function pressAnswer() {
  if (lastAnswer === "") return;
  if (justEvaluated) {
    display.value = "";
    justEvaluated = false;
  }
  if (/[\d.)]$/.test(display.value)) display.value += "×";
  display.value += lastAnswer;
}

document.addEventListener("keydown", (event) => {
  if (!calculatorActive) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.shiftKey && event.code === "Digit2") {
    event.preventDefault();
    if (!event.repeat) handle("2nd", findButton("2nd"));
    return;
  }

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  let label = null;
  if (/^[0-9.]$/.test(key)) label = key;
  else if (KEY_MAP[key]) label = KEY_MAP[key];
  if (!label) return;

  if (shiftmode && ["SIN", "COS", "TAN"].includes(label)) {
    label = SWAP[label];
  }

  event.preventDefault();
  handle(label, findButton(label));
});

const defaultLinks = [
  { name: "Gmail", url: "https://mail.google.com" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "Claude", url: "https://claude.ai" },
  { name: "Github", url: "https://github.com" },
];

let links = JSON.parse(localStorage.getItem("links")) || defaultLinks;

const addForm = document.getElementById("addform");

addForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("newname").value.trim();
  const url = document.getElementById("newurl").value.trim();
  if (!name || !url) return;

  try {
    new URL(normaliseUrl(url));
  } catch {
    return;
  }

  links.push({ name, url });
  saveLinks();
  renderLinks();

  document.getElementById("newname").value = "";
  document.getElementById("newurl").value = "";
  addForm.hidden = true;
});

function normaliseUrl(url) {
  return /^https?:\/\//.test(url) ? url : "https://" + url;
}

function faviconFor(url) {
  const domain = new URL(normaliseUrl(url)).hostname;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

const linksBox = document.getElementById("links");

function renderLinks() {
  linksBox.innerHTML = "";

  links.forEach((link, index) => {
    const item = document.createElement("div");
    item.className = "link-item";

    const a = document.createElement("a");
    a.className = "link-btn";
    a.href = normaliseUrl(link.url);

    const img = document.createElement("img");
    img.alt = "";
    img.src = faviconFor(link.url);
    img.onerror = () => {
      const badge = document.createElement("div");
      badge.className = "link-fallback";
      badge.textContent = link.name[0].toUpperCase();
      img.replaceWith(badge);
    };

    const label = document.createElement("span");
    label.textContent = link.name;

    a.append(img, label);

    const remove = document.createElement("button");
    remove.className = "link-remove";
    remove.textContent = "×";
    remove.title = "Remove " + link.name;
    remove.setAttribute("aria-label", "Remove " + link.name);
    remove.addEventListener("click", () => {
      links.splice(index, 1);
      saveLinks();
      renderLinks();
    });

    item.append(a, remove);
    linksBox.appendChild(item);
  });

  const addItem = document.createElement("div");
  addItem.className = "link-item";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "link-btn link-add";
  addBtn.innerHTML = '<span class="add-icon" aria-hidden="true">+</span><span>Add</span>';
  addBtn.addEventListener("click", () => {
    addForm.hidden = !addForm.hidden;
    if (!addForm.hidden) document.getElementById("newname").focus();
  });

  addItem.appendChild(addBtn);
  linksBox.appendChild(addItem);
}

renderLinks();

function saveLinks() {
  localStorage.setItem("links", JSON.stringify(links));
}

const monthLabel = document.getElementById("calmonth");
const calBody = document.getElementById("calbody");

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();

function renderCalendar() {
  monthLabel.textContent = new Date(viewYear, viewMonth).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  calBody.innerHTML = "";
  let row = document.createElement("tr");

  for (let i = 0; i < firstWeekday; i++) {
    row.appendChild(document.createElement("td"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("td");
    cell.textContent = day;

    if (
      day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    row.appendChild(cell);

    if (row.children.length === 7) {
      calBody.appendChild(row);
      row = document.createElement("tr");
    }
  }

  while (calBody.children.length < 6) {
    while (row.children.length < 7) {
      row.appendChild(document.createElement("td"));
    }
    calBody.appendChild(row);
    row = document.createElement("tr");
  }
}

function changeMonth(step) {
  const d = new Date(viewYear, viewMonth + step, 1);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
  renderCalendar();
}

document.getElementById("calprev").addEventListener("click", () => changeMonth(-1));
document.getElementById("calnext").addEventListener("click", () => changeMonth(1));

renderCalendar();