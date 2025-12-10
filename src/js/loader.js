// Source - https://stackoverflow.com/a
// Posted by some user, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-10, License - CC BY-SA 4.0

window.onload = function () {
  console.log(solve(item.textbox, "textbox"));
}

const item = {
  textbox: {
    id: 1,
    name: "Text Box",
    tmprops: {
      cur: 0,
      min: 5000,
      visible: true,
    },
    tmctxlst: {
      version: "2",
      txttmctx: {
        alwysshw: false,
        name: "default"
      }
    },
  }
}

function solve(obj, tagName) {
  const tag = document.createElement(tagName);
  const currentKeys = Object.keys(obj)

  currentKeys.forEach((attribute => {
    if (typeof obj[attribute] === "object") {
      tag.appendChild(solve(obj[attribute], attribute))
    } else {
      tag.setAttribute(attribute, obj[attribute]);
    }
  }))
  return tag;
}

function createSpinBox(min, max, step, value) {
  const spinBox = document.createElement("input"); // TODO: replace with bootstrap spinbox
  spinBox.type = "number";
  spinBox.min = min;
  spinBox.max = max;
  spinBox.step = step;
  spinBox.value = value;
  return spinBox;
}

function createCheckBox(checked) {
  const checkBox = document.createElement("input"); // TODO: replace with bootstrap checkbox
  checkBox.type = "checkbox";
  checkBox.checked = checked;
  return checkBox;
}

function createTextBox(value) {
  const textBox = document.createElement("input"); // TODO: replace with bootstrap textbox
  textBox.type = "text";
  textBox.value = value;
  return textBox;
}

function createRangeBox(min, max, value) {
  const rangeBox = document.createElement("input"); // TODO: replace with bootstrap rangebox
  rangeBox.type = "range";
  rangeBox.min = min;
  rangeBox.max = max;
  rangeBox.value = value;
  return rangeBox;
}

function createSelectBox(options, defaultOption) {
  const selectBox = document.createElement("select"); // TODO: replace with bootstrap selectbox
  return selectBox;
}
