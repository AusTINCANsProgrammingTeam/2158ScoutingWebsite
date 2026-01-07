var configFileName = "2025.json";
var form = document.getElementsByClassName("formBody")[0];

// Prematch
const prematchConfig = {
  name: "Prematch",
  preserveDataOnReset: true,
  fields: [
    { title: "Scouter Name", type: "text", required: true, code: "scouter", defaultValue: "" },
    { title: "Match Number", type: "number", required: true, code: "matchNumber", defaultValue: "0" },
    {
      title: "Robot", type: "select", required: true,
      code: "robot",
      choices: { R1: "Red 1", R2: "Red 2", R3: "Red 3", B1: "Blue 1", B2: "Blue 2", B3: "Blue 3" },
      defaultValue: "R1"
    },
    { title: "Team Number", type: "number", required: true, code: "teamNumber", defaultValue: "0" },
    { title: "No Show", type: "checkbox", code: "noShow", defaultValue: false },
    { title: "Starting Position", type: "clickImg", required: true, imgRed: "../img/field_2025_red.png", imgBlue: "../img/field_2025_blue.png", code: "startingPosition", defaultValue: "" }
  ]
};

// Form Variables
var startingPosition = (0,0)

/*
 *  Init 
 */
async function websiteBuilder() {
  const response = await fetch('../configs/' + configFileName);
  const data = await response.json();

  renderSection("Prematch", prematchConfig.fields);
  renderConfigSections(data.sections);
}

document.addEventListener('DOMContentLoaded', async () => {
  await websiteBuilder();
  addFormButtons();
});

/*
* Render Functions
*/
function renderConfigSections(sections) {
  form.onsubmit = submitFunction;
  sections.forEach(section => renderSection(section.name, section.fields));
}

function renderSection(name, fields) {
  const sectionDiv = createElement("div", "row center clearfix border-bottom content-style1");

  const title = createElement("h4", "text-primary");
  title.innerText = name;
  title.style.textAlign = "center";
  sectionDiv.appendChild(title);

  const fieldContainer = createElement("div", "col-auto");
  sectionDiv.appendChild(fieldContainer);

  fields.forEach(field => {
    fieldContainer.appendChild(renderField(field));
  });

  form.appendChild(sectionDiv);
}

function renderField(field) {
  const { type } = field;

  const factories = {
    text: createTextBox,
    number: createNumberInput,
    checkbox: createCheckBox,
    range: createRangeBox,
    select: createSelectBox,
    spinbox: createSpinBox,
    clickImg: createClickImage
  };

  return factories[type](field);
}

/*
 *  Factory Functions 
 */
function createTextBox({ code, title, defaultValue, required }) {
  const el = wrapper();
  el.appendChild(labelFor(code, title));

  const input = inputBase("text", code, defaultValue, required);
  el.appendChild(input);

  return el;
}

function createNumberInput({ code, title, defaultValue, required }) {
  const el = wrapper();
  el.appendChild(labelFor(code, title));

  const input = inputBase("number", code, defaultValue, required);
  el.appendChild(input);

  return el;
}

// TODO: Fix checkboxes not being added to form submit
function createCheckBox({ code, title, defaultValue, required }) {
  const el = createElement("div", "form-check");

  const input = createElement("input", "form-check-input reset");
  input.type = "checkbox";
  input.id = code;
  input.name = code;
  input.checked = defaultValue;
  input.dataset.default = defaultValue;
  input.required = required;

  const lbl = createElement("label", "form-check-label");
  lbl.htmlFor = code;
  lbl.innerText = title;

  el.append(lbl, input);
  return el;
}

function createSpinBox({ code, title, min = 0, max = 10, step = 1, defaultValue = 0, required }) {
  const el = wrapper();
  el.appendChild(labelFor(code, title));

  const spinBox = createElement("div", "input-group spinbox-group flex-nowrap center");

  const decrement = button("-", () => changeSpin(code, -step, min, max));
  const increment = button("+", () => changeSpin(code, step, min, max));
  const input = inputBase("number", code, defaultValue, required);

  // numeric attributes
  input.min = min;
  input.max = max;
  input.step = step;

  spinBox.append(decrement, input, increment);
  el.appendChild(spinBox);
  return el;
}

function createClickImage({ code, title, imgRed, imgBlue, defaultValue, required }) {
  const el = wrapper();
  el.appendChild(labelFor(code, title));
  el.classList = "center"

  const canvas = document.createElement("canvas");
  canvas.classList = "center"
  canvas.id = code;
  canvas.style.cursor = "crosshair";
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  el.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.src = imgRed;


  let currentImage = new Image();
  currentImage.src = imgRed;
  currentImage.onload = () => drawImage();
  // Due to selection element not being rendered yet
  setTimeout(() => {
    var selectedRobot = document.getElementById("robot")
    selectedRobot.addEventListener("change", function () {
      if (this.value.charAt(0) == 'B') {
        currentImage.src =imgBlue
      } else {
        currentImage.src = imgRed
      }
      console.log(currentImage.src)
      currentImage.onload = () => {
        startingPosition = null;
        drawImage();
      };
    })
  }, 1000)

  canvas.addEventListener("click", function (event) {
    const rect = canvas.getBoundingClientRect();

    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    startingPosition = { x, y };

    drawImage();
    drawMarker(startingPosition.x, startingPosition.y);

    console.log(`Clicked at: (${x}, ${y})`);
  });

  function drawImage() {
    // Resize canvas to match the image
    canvas.width = currentImage.naturalWidth;
    canvas.height = currentImage.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0);
  }

  function drawMarker(x, y) {
    radius = 32
    if (currentImage.src == imgBlue){
      ctx.fillStyle = "blue";
    } else {
      ctx.fillStyle = "red";
    }
    ctx.beginPath();
    ctx.rect(x-radius/2, y-radius/2, radius, radius);
    ctx.fill();
  }
  return el;
}

function createRangeBox({ code, title, min = 0, max = 10, step = 1, defaultValue = null, required }) {
  const el = wrapper();
  el.appendChild(labelFor(code, title));

  const actualDefault = defaultValue ?? min;
  const range = inputBase("range", code, actualDefault, required);
  range.min = min;
  range.max = max;
  range.step = step;

  const output = createElement("output", "form-label");
  output.textContent = actualDefault;

  range.addEventListener("input", () => {
    output.textContent = range.value;
  });

  el.append(range, output);
  return el;
}

function createSelectBox({ code, title, choices, defaultValue, required }) {
  const el = wrapper();
  el.appendChild(labelFor(code, title));

  const select = createElement("select", "form-select reset");
  select.id = code;
  select.name = code;
  select.dataset.default = defaultValue;
  select.required = required

  for (let key in choices) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = choices[key];
    select.appendChild(option);
  }

  select.value = defaultValue; // FIXED
  el.appendChild(select);
  return el;
}

/*
* Form Functions
*/
function submitFunction(e) {
  e.preventDefault();
  const data = new FormData(e.target).entries()
  const formData = Object.fromEntries(data)
  formData.startingPos = `${startingPosition.x}, ${startingPosition.y}`
 
  fetch('/submit-form', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });
}

function resetFunction(e) {
  e.preventDefault();
  console.log("reset");

  for (let element of document.getElementsByClassName("reset")) {
    if (element.id === "matchNumber") {
      const num = parseInt(element.value);
      element.value = isNaN(num) ? 1 : num + 1;
      continue;
    }

    if (element.type === "checkbox") {
      element.checked = element.dataset.default === "true";
      continue;
    }

    if (element.tagName === "SELECT") {
      element.value = element.dataset.default;
      continue;
    }

    element.value = element.dataset.default;

    if (element.type === "range") {
      const output = element.nextElementSibling;
      if (output) output.textContent = element.value;
    }
  }
}

/*
 *  Element Constructors 
 */
function wrapper() {
  return createElement("div");
}

function labelFor(id, text) {
  const lbl = createElement("label", "form-label p-2");
  lbl.htmlFor = id;
  lbl.innerText = text;
  return lbl;
}

function inputBase(type, id, value, required) {
  const input = createElement("input", "reset");
  input.type = type;
  input.id = id;
  input.name = id;
  input.classList = "form-control"
  input.value = value;
  input.dataset.default = value;
  input.required = required;
  return input;
}

function button(text, onClick) {
  const btn = createElement("button", "btn btn-primary");
  btn.type = "button";
  btn.textContent = text;
  btn.onclick = onClick;
  return btn;
}

function changeSpin(id, delta, min, max) {
  const input = document.getElementById(id);
  let val = parseInt(input.value) || 0;
  const newVal = Math.min(max, Math.max(min, val + delta));
  input.value = newVal;
}

function createElement(tag, classList = "") {
  const el = document.createElement(tag);
  if (classList) el.className = classList;
  return el;
}

function addFormButtons() {
  const submitDiv = createElement("div", "row mt-3 mb-3");
  const submit = createElement("input", "btn btn-primary d-block mt-2 center content-style1");
  submit.type = "submit";
  submitDiv.appendChild(submit);

  const resetDiv = createElement("div");
  const reset = createElement("input", "btn btn-secondary d-block mt-2 center content-style1");
  reset.type = "reset";
  reset.onclick = resetFunction;
  resetDiv.appendChild(reset);

  const getKeys = createElement("input", "btn btn-secondary d-block mt-2 center content-style1");
  getKeys.type = "button";
  getKeys.value = "Get Form Keys";
  getKeys.onclick = () => {
    const formData = new FormData(form);
    const formKeys = Object.keys(Object.fromEntries(formData.entries()))
    formKeys.push("startingPos")
    console.log(formKeys.join(", "));
  };

  form.append(submitDiv, resetDiv, getKeys);
}