var configFileName = "2025.json";
var form = document.getElementsByClassName("formBody")[0]


const prematchConfig = {
  "name": "Prematch",
  "preserveDataOnReset": true,
  "fields": [
    {
      "title": "Scouter Name",
      "type": "text",
      "required": true,
      "code": "scouter",
      "defaultValue": ""
    },
    {
      "title": "Match Number",
      "type": "number",
      "required": true,
      "code": "matchNumber",
      "defaultValue": "0"
    },
    {
      "title": "Robot",
      "type": "select",
      "required": true,
      "code": "robot",
      "choices": {
        "R1": "Red 1",
        "R2": "Red 2",
        "R3": "Red 3",
        "B1": "Blue 1",
        "B2": "Blue 2",
        "B3": "Blue 3"
      },
      "defaultValue": "R1"
    },
    {
      "title": "Team Number",
      "type": "number",
      "required": true,
      "code": "teamNumber",
      "defaultValue": "0"
    },
    {
      "title": "No Show",
      "type": "checkbox",
      "defaultValue": false,
      "required": false,
      "code": "noShow"
    }
  ]
}

async function websiteBuilder() {
  const response = await fetch('../configs/' + configFileName); 
  const data = await response.json();
  renderPrematch(prematchConfig);
  render(await data);
}

document.addEventListener('DOMContentLoaded', async function () {
  let submitDiv = document.createElement("div");
  submitDiv.className = "row mt-3 mb-3";
  let submit = document.createElement("input");
  submit.type = "submit";
  submit.className = "btn btn-primary d-block mt-2 center content-style1";
  submitDiv.appendChild(submit);

  let resetDiv = document.createElement("div");
  let reset = document.createElement("input");
  reset.type = "reset";
  reset.className = "btn btn-secondary d-block mt-2 center content-style1";
  reset.onclick = resetFunction;
  resetDiv.appendChild(reset);

  let getKeys = document.createElement("input");;
  getKeys.type = "button";
  getKeys.value = "Get Form Keys";
  getKeys.className = "btn btn-secondary d-block mt-2 center content-style1";
  getKeys.onclick = function() {
    let formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());
    console.log("" + Object.keys(data).join(", "));
  }
  websiteBuilder().finally(() => {
    document.getElementsByClassName("formBody")[0].appendChild(submitDiv)
    document.getElementsByClassName("formBody")[0].appendChild(resetDiv)
    document.getElementsByClassName("formBody")[0].appendChild(getKeys)
  }
  );
});

function renderPrematch(config) { // TODO: Add extra logic
  // console.log(config["sections"][0]["fields"]);
  const sectionDiv = document.createElement("div");
  sectionDiv.className = "row center clearfix border-bottom content-style1";

  const sectionTitle = document.createElement("h4");
  sectionTitle.className = "text-primary";
  sectionTitle.innerText = "Prematch";
  sectionTitle.style.textAlign = "center";
  sectionDiv.appendChild(sectionTitle);

  const sectionFields = document.createElement("div");
  sectionFields.className = "col-auto";
  sectionDiv.appendChild(sectionFields);
  config.fields.forEach(field => {
      switch (field.type) {
        case "text":
          sectionFields.appendChild(createTextBox(field["code"], field["title"], field["defaultValue"], field["required"]))
          break
        case "number":
          sectionFields.appendChild(createNumberInput(field["code"], field["title"], field["defaultValue"],
            field["required"] == undefined ? false : field["required"]))
          break
        case "checkbox":
          sectionFields.appendChild(createCheckBox(
            field["code"], field["title"],
            (field["defaultValue"] == undefined) ? false : field["defaultValue"]
          ))
          break
        case "range":
          sectionFields.appendChild(createRangeBox(field["code"], field["title"],
            (field["min"] == undefined) ? 0 : field["min"],
            (field["max"] == undefined) ? 10 : field["max"],
            (field["defaultValue"] == undefined) ? min : field["defaultValue"],
            (field["step"] == undefined) ? 1 : field["step"],
            (field["required"] == undefined) ? false : field["required"]))
          break
        case "select":
          sectionFields.appendChild(createSelectBox(field["code"], field["title"], field["choices"], field["defaultValue"],
            field["required"] == undefined ? false : field["required"]
          ))
          break
        case "spinbox":
          sectionFields.appendChild(createSpinBox(field["code"], field["title"],
            field["min"] == undefined ? 0 : field["min"],
            field["max"] == undefined ? 10 : field["max"],
            field["step"] == undefined ? 1 : field["step"],
            field["required"] == undefined ? false : field["required"]))
          break
      }
    })
  form.appendChild(sectionDiv);
  return form;
}

function render(config) {
  // console.log(config["sections"][0]["fields"]);
  form.onsubmit = submitFunction;

  config.sections.forEach(section => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "row center clearfix border-bottom content-style1";

    const sectionTitle = document.createElement("h4");
    sectionTitle.className = "text-primary";
    sectionTitle.innerText = section.name;
    sectionTitle.style.textAlign = "center";
    sectionDiv.appendChild(sectionTitle);

    const sectionFields = document.createElement("div");
    sectionFields.className = "col-auto";
    sectionDiv.appendChild(sectionFields);

    section.fields.forEach(field => {
      switch (field.type) {
        case "text":
          sectionFields.appendChild(createTextBox(field["code"], field["title"], field["defaultValue"], field["required"]))
          break
        case "number":
          sectionFields.appendChild(createNumberInput(field["code"], field["title"], field["defaultValue"],
            field["required"] == undefined ? false : field["required"]))
          break
        case "checkbox":
          sectionFields.appendChild(createCheckBox(
            field["code"], field["title"],
            (field["defaultValue"] == undefined) ? false : field["defaultValue"]
          ))
          break
        case "range":
          sectionFields.appendChild(createRangeBox(field["code"], field["title"],
            (field["min"] == undefined) ? 0 : field["min"],
            (field["max"] == undefined) ? 10 : field["max"],
            (field["defaultValue"] == undefined) ? min : field["defaultValue"],
            (field["step"] == undefined) ? 1 : field["step"],
            (field["required"] == undefined) ? false : field["required"]))
          break
        case "select":
          sectionFields.appendChild(createSelectBox(field["code"], field["title"], field["choices"], field["defaultValue"],
            field["required"] == undefined ? false : field["required"]
          ))
          break
        case "spinbox":
          sectionFields.appendChild(createSpinBox(field["code"], field["title"],
            field["min"] == undefined ? 0 : field["min"],
            field["max"] == undefined ? 10 : field["max"],
            field["step"] == undefined ? 1 : field["step"],
            field["defaultValue"] == undefined ? 0 : field["defaultValue"],
            field["required"] == undefined ? false : field["required"]))
          break
      }
    })
    form.appendChild(sectionDiv);
  })
  return form;
}

function createSpinBox(id, title, min, max, step, value, required) {
  let element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.classList = "form-label"
  label.innerText = title;
  element.appendChild(label);

  let spinBox = document.createElement("div");
  spinBox.classList = "input-group mb-3 spinbox-group flex-nowrap";

  let decrementButton = document.createElement("button");
  decrementButton.classList = "btn btn-primary";
  decrementButton.type = "button";
  decrementButton.innerText = "-";
  decrementButton.dataset.field = id;
  decrementButton.addEventListener("click", () => decrementValue(decrementButton, min, step));
  spinBox.append(decrementButton);

  const num = document.createElement("input"); // TODO: replace with bootstrap spinbox
  num.dataset.type = "number";
  num.dataset.default = value;
  num.min = min;
  num.max = max;
  num.step = step;
  num.value = value;
  num.id = id;
  num.name = id;
  num.required = required;
  num.classList = "spinbox reset";
  spinBox.append(num);

  let incrementButton = document.createElement("button");
  incrementButton.classList = "btn btn-primary";
  incrementButton.type = "button";
  incrementButton.innerText = "+";
  incrementButton.dataset.field = id;
  incrementButton.addEventListener("click", () => incrementValue(incrementButton, max, step));
  spinBox.append(incrementButton);

  element.appendChild(spinBox);

  return element;
}

function createCheckBox(id, title, checked, required) {
  const element = document.createElement("div");
  element.classList = "form-check";

  const label = document.createElement("label");
  label.for = id;
  label.classList = "form-check-label";
  label.innerText = title;
  element.appendChild(label);

  const checkBox = document.createElement("input");
  checkBox.classList = "form-check-input reset";
  checkBox.type = "checkbox";
  checkBox.id = id;
  checkBox.checked = checked;
  checkBox.dataset.default = checked;
  checkBox.name = id;
  checkBox.required = required;
  element.appendChild(checkBox);

  return element;
}

function createTextBox(id, title, value, required) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.classList = "form-label p-2";
  label.innerText = title;
  element.appendChild(label);

  const textBox = document.createElement("input");
  textBox.id = id;
  textBox.type = "text";
  textBox.value = value;
  textBox.dataset.default = value;
  textBox.required = required;
  textBox.name = id;
  textBox.classList = "reset";
  element.appendChild(textBox);

  return element;
}

function createNumberInput(id, title, value, required) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.classList = "form-label p-2";
  label.innerText = title;
  element.appendChild(label);

  const num = document.createElement("input");
  num.type = "number";
  num.value = value;
  num.dataset.default = value;
  num.required = required;
  num.name = id;
  num.id = id;
  num.classList = "reset";
  num.required = required;
  element.appendChild(num);

  return element;
}

function createRangeBox(id, title, min, max, value, step, required) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.innerText = title;
  label.classList = "form-label p-2";
  element.appendChild(label);

  const rangeBox = document.createElement("input"); // TODO: replace with bootstrap rangebox
  rangeBox.classList = "me-2 reset";
  rangeBox.type = "range";
  rangeBox.min = min;
  rangeBox.max = max;
  rangeBox.step = step;
  rangeBox.id = id;
  rangeBox.value = value;
  rangeBox.dataset.default = value;
  rangeBox.name = id;
  rangeBox.required = required;
  element.appendChild(rangeBox);

  const output = document.createElement("output")
  output.for = id;
  output.classList = "form-label";
  output.textContent = rangeBox.value;
  element.appendChild(output);

  rangeBox.addEventListener('input', function () {
    output.textContent = this.value;
  });

  return element;
}

function createSelectBox(id, title, options, defaultOption) {
  let element = document.createElement("div");
  element.style.marginBottom = "15px";

  let label = document.createElement("label");
  label.for = id;
  label.innerText = title;
  label.classList = "form-label";
  element.appendChild(label);

  const selectBox = document.createElement("select"); // TODO: replace with bootstrap selectbox
  selectBox.classList = "form-select reset";
  selectBox.name = id;
  selectBox.id = id;
  selectBox.dataset.default = defaultOption;
  for (let option in options) {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.text = options[option];
    selectBox.appendChild(optionElement);
  }
  element.appendChild(selectBox);

  return element;
}


function incrementValue(e, max, step) {
  const input = document.getElementById(e.dataset.field);
  let currentVal = parseInt(input.value, 10) || 0;

  if (currentVal < max) input.value = currentVal + step;
}

function decrementValue(e, min, step) {
  const input = document.getElementById(e.dataset.field);
  let currentVal = parseInt(input.value, 10) || 0;

  if (currentVal > min) input.value = currentVal - step;
}

function submitFunction(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  fetch('/submit-form', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  console.log(data);
}

function resetFunction(e) {
  e.preventDefault();

  console.log("reset");

  let elements = document.getElementsByClassName("reset");
  for (let element of elements) {
    if (element.id == "matchNumber") {
      element.value = parseInt(element.value) + 1;
    } else if (element.classList.contains("form-check-input")) {
      element.checked = element.dataset.default == "true" ? true : false;
    } else if (element.id != "scouter" && element.id != "robot") {
      element.value = element.dataset.default;
    }
  }
}