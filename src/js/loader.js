
document.addEventListener('DOMContentLoaded', function () {
  let submitDiv = document.createElement("div");
  submitDiv.className = "row mt-3 mb-3";
  let submit = document.createElement("input");
  submit.type = "submit";
  submit.className = "btn btn-primary d-block mt-2 center content-style1";
  submitDiv.appendChild(submit);
  render(config)
  document.getElementsByClassName("formBody")[0].appendChild(submitDiv);
});

const config = {
  sections: [
    {
      "name": "Autonomous",
      "fields": [
        {
          "code": "aucor1",
          "title": "L1 Coral Scored",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
        },
        {
          "code": "aucor2",
          "title": "L2 Coral Scored",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
        },
        {
          "code": "aucor3",
          "title": "L3 Coral Scored",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
        },
        {
          "code": "aucor4",
          "title": "L4 Coral Scored",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
        }, {
          "code": "aumcor4",
          "title": "L4 Coral Missed",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
        },
        {
          "code": "aualgp",
          "title": "Algae Scored Processor",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
        },
        {
          "code": "aualgn",
          "title": "Algae Scored Net",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
        },
        {
          "code": "auf",
          "title": "Auto Foul",
          "type": "checkbox",
          "defaultValue": false,
        },
        {
          "code": "aul",
          "title": "Auto Leave",
          "type": "checkbox",
          "defaultValue": false,
        }
      ]
    },
    {
      "name": "Teleop",
      "fields": [
        {
          "code": "tcor1",
          "title": "L1 Coral Scored",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
          "required": false
        },
        {
          "code": "tcor2",
          "title": "L2 Coral Scored",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
          "required": false
        },
        {
          "code": "tcor3",
          "title": "L3 Coral Scored",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
          "required": false
        },
        {
          "code": "tcor4",
          "title": "L4 Coral Scored",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
          "required": false
        }, {
          "code": "tmcor4",
          "title": "L4 Coral Missed",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
          "required": false
        },
        {
          "code": "talgp",
          "title": "Algae Scored Processor",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
          "required": false
        },
        {
          "code": "talgn",
          "title": "Algae Scored Net",
          "type": "spinbox",
          "defaultValue": 0,
          "min": 0,
          "required": false
        }
      ]
    }
  ]
}

function render(config) {
  // console.log(config["sections"][0]["fields"]);
  var form = document.getElementsByClassName("formBody")[0]

  config.sections.forEach(section => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "row center clearfix border-bottom content-style1";

    const sectionTitle = document.createElement("h4");
    sectionTitle.innerText = section.name;
    sectionTitle.style.textAlign = "center";
    sectionDiv.appendChild(sectionTitle);

    const sectionFields = document.createElement("div");
    sectionFields.className = "col-auto";
    sectionDiv.appendChild(sectionFields);

    section.fields.forEach(field => {
      console.log(field);
      switch (field.type) {
        case "text":
          sectionFields.appendChild(createTextBox(field["code"], field["title"], field["defaultValue"], field["required"]))
          break
        case "number":
          sectionFields.appendChild(createNumberInput(field["code"], field["title"], field["defaultValue"]))
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
            (field["step"] == undefined) ? 1 : field["step"]))
          break
        case "select":
          sectionFields.appendChild(createSelectBox(field["code"], field["title"], field["choices"], field["defaultValue"]))
          break
        case "spinbox":
          sectionFields.appendChild(createSpinBox(field["code"], field["title"],
            field["min"] == undefined ? 0 : field["min"],
            field["max"] == undefined ? 10 : field["max"],
            field["step"] == undefined ? 1 : field["step"]))
          break
      }
    })
    form.appendChild(sectionDiv);
  })
  return form;
}

function createSpinBox(id, title, min, max, step, value) {
  let element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.classList = "form-label";
  label.innerText = title;
  element.appendChild(label);

  let spinBox = document.createElement("div");
  spinBox.classList = "input-group mb-3 spinbox-group";

  let decrementButton = document.createElement("button");
  decrementButton.classList = "btn btn-primary";
  decrementButton.type = "button";
  decrementButton.innerText = "-";
  decrementButton.dataset.field = id;
  decrementButton.addEventListener("click", () => decrementValue(decrementButton, min, step));
  spinBox.append(decrementButton);

  const num = document.createElement("input"); // TODO: replace with bootstrap spinbox
  num.dataset.type = "number";
  num.min = min;
  num.max = max;
  num.step = step;
  num.value = value;
  num.id = id;
  num.value = min;
  num.name = id;
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

function createCheckBox(id, title, checked) {
  const element = document.createElement("div");
  element.classList = "form-check";

  const label = document.createElement("label");
  label.for = id;
  label.classList = "form-check-label";
  label.innerText = title;
  element.appendChild(label);

  const checkBox = document.createElement("input");
  checkBox.classList = "form-check-input";
  checkBox.type = "checkbox";
  checkBox.id = id;
  checkBox.checked = checked
  checkBox.name = id;
  element.appendChild(checkBox);

  return element;
}

function createTextBox(id, title, value, required) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.classList = "form-label";
  label.innerText = title;
  element.appendChild(label);

  const textBox = document.createElement("input");
  textBox.id = id;
  textBox.type = "text";
  textBox.value = value;
  textBox.required = required;
  textBox.name = id;
  element.appendChild(textBox);

  return element;
}

function createNumberInput(id, title, value, required) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.classList = "form-label";
  label.innerText = title;
  element.appendChild(label);

  const num = document.createElement("input");
  num.type = "number";
  num.value = value;
  num.required = required;
  num.name = id;
  element.appendChild(num);

  return element;
}

function createRangeBox(id, title, min, max, value, step) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.innerText = title;
  label.classList = "form-label";
  element.appendChild(label);

  const rangeBox = document.createElement("input"); // TODO: replace with bootstrap rangebox
  rangeBox.type = "range";
  rangeBox.min = min;
  rangeBox.max = max;
  rangeBox.step = step;
  rangeBox.id = id;
  rangeBox.value = value;
  rangeBox.name = id;
  element.appendChild(rangeBox);

  return element;
}

function createSelectBox(id, title, options, defaultOption) {
  let element = document.createElement("div");

  let label = document.createElement("label");
  label.for = id;
  label.innerText = title;
  label.classList = "form-label";
  element.appendChild(label);

  const selectBox = document.createElement("select"); // TODO: replace with bootstrap selectbox
  selectBox.classList = "form-select";
  selectBox.name = id;
  selectBox.id = id; s
  for (let option in options) {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.text = option.text;
    selectBox.appendChild(optionElement);
  }
  selectBox.datasest.options = options;
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
