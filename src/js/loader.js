// Source - https://stackoverflow.com/a
// Posted by some user, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-10, License - CC BY-SA 4.0
window.onload = function () {
  console.log(render(config));
}

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
          },{
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
      }
  ]
}

function render(config) {
  // console.log(config["sections"][0]["fields"]);
  var form = document.createElement("form");

  Object.values(config).forEach(sections => {
    var section = document.createElement("div");
    section.class = "container border-bottom";
    var sectionTitle = document.createElement("h4");
    sectionTitle.innerText = sections["name"];
    section.appendChild(sectionTitle);
    console.log(sections)

    Object.values(sections[0]["fields"]).forEach(field => {
      console.log(field);
      switch (field.type) {
        case "text":
          createTextBox(field["code"], field["title"], field["defaultValue"], field["required"]);
        case "number":
          createNumberInput(field["code"], field["title"], field["defaultValue"]);
        case "checkbox":
          createCheckBox(
            field["code"], field["title"],
            (field["defaultValue"] == undefined) ? false : field["defaultValue"]
          );
        case "range":
          createRangeBox(field["code"], field["title"],
            (field["min"] == undefined) ? 0 : field["min"],
            (field["max"] == undefined) ? 10 : field["max"],
            (field["defaultValue"] == undefined) ? min : field["defaultValue"],
            (field["step"] == undefined) ? 1 : field["step"]);
        case "select":
          createSelectBox(field["code"], field["title"], field["choices"], field["defaultValue"]);
        case "spinbox":
          createSpinBox(field["code"], field["title"],
            field["min"] == undefined ? 0 : field["min"],
            field["max"] == undefined ? 10 : field["max"],
            field["step"] == undefined ? 1 : field["step"]);
      }
    })
    form.appendChild(section);
  })
  return form;
}

function createSpinBox(id, title, min, max, step, value) {
  let element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.class = "form-label";
  label.innerText = title;
  element.appendChild(label);

  let spinBox = document.createElement("div");
  spinBox.class = "input-group mb-3 spinbox-group";

  let decrementButton = document.createElement("button");
  decrementButton.class = "btn btn-outline-secondary";
  decrementButton.type = "button";
  decrementButton.innerText = "-";
  decrementButton.dataset.field = id;
  decrementButton.addEventListener("click", decrementValue(decrementButton));
  spinBox.append(decrementButton);

  const num = document.createElement("input"); // TODO: replace with bootstrap spinbox
  num.dataset.type = "number";
  num.min = min;
  num.max = max;
  num.step = step;
  num.value = value;
  num.id = id;
  spinBox.append(num);

  let incrementButton = document.createElement("button");
  incrementButton.class = "btn btn-outline-secondary";
  incrementButton.type = "button";
  incrementButton.innerText = "+";
  incrementButton.dataset.field = id;
  incrementButton.addEventListener("click", incrementValue(incrementButton));
  spinBox.append(incrementButton);

  element.appendChild(spinBox);

  return element;
}

function createCheckBox(id, title, checked) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.class = "form-label";
  label.innerText = title;
  element.appendChild(label);

  const checkBox = document.createElement("input");
  checkBox.type = "checkbox";
  checkBox.id = id;
  checkBox.checked = checked
  element.appendChild(checkBox);

  return element;
}

function createTextBox(id, title, value, required) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.class = "form-label";
  label.innerText = title;
  element.appendChild(label);

  const textBox = document.createElement("input");
  textBox.id = id;
  textBox.type = "text";
  textBox.value = value;
  textBox.required = required;
  element.appendChild(textBox);

  return element;
}

function createNumberInput(id, title, value, required) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.class = "form-label";
  label.innerText = title;
  element.appendChild(label);
  
  const num = document.createElement("input");
  num.type = "number";
  num.value = value;
  num.required = required;
  element.appendChild(num);

  return element;
}

function createRangeBox(id, title, min, max, value, step) {
  const element = document.createElement("div");

  const label = document.createElement("label");
  label.for = id;
  label.innerText = title;
  label.class = "form-label";
  element.appendChild(label);

  const rangeBox = document.createElement("input"); // TODO: replace with bootstrap rangebox
  rangeBox.type = "range";
  rangeBox.min = min;
  rangeBox.max = max;
  rangeBox.step = step;
  rangeBox.id = id;
  rangeBox.value = value;
  element.appendChild(rangeBox);

  return element;
}

function createSelectBox(id, title, options, defaultOption) {
  let element = document.createElement("div");

  let label = document.createElement("label");
  label.for = id;
  label.innerText = title;
  label.class = "form-label";
  element.appendChild(label);

  const selectBox = document.createElement("select"); // TODO: replace with bootstrap selectbox
  selectBox.class = "form-select";
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


function incrementValue(e) {
  var parent = document.querySelectorAll(`[data-field=${e.dataset.field}]`);
  var currentVal = parseInt(parent, 10);
  if (!isNaN(currentVal)) {
    parent.val(currentVal + 1);
  } else {
    parent.val(0);
  }
}

function decrementValue(e) {
  var parent = document.querySelectorAll(`[data-field=${e.dataset.field}]`);
  var currentVal = parseInt(parent, 10);
  if (!isNaN(currentVal) && currentVal > 0) {
    parent.val(currentVal - 1);
  } else {
    parent.val(0);
  }
}