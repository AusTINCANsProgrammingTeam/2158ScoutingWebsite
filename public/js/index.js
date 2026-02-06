const API_URL = "https://api-2sv4ordija-uc.a.run.app";
const CONFIG_PATH = "../configs/";

var appState;
class AppState {
  constructor() {
    this.currentConfigVersion = "2026.json";
    this.configYear = 2026;
    this.startingPosition = { x: 0, y: 0 };
  }

  setConfigVersion(version) {
    this.currentConfigVersion = version;
  }

  setConfigYear(year) {
    this.configYear = year;
  }

  setStartingPosition(x, y) {
    this.startingPosition = { x, y };
  }

  getState() {
    return {
      configVersion: this.currentConfigVersion,
      year: this.configYear,
      startingPosition: this.startingPosition
    };
  }
}

const PREMATCH_CONFIG = {
  name: "Prematch",
  preserveDataOnReset: true,
  fields: [
    {
      title: "Scouter Name",
      type: "text",
      required: true,
      code: "scouter",
      defaultValue: "",
    },
    {
      title: "Match Number",
      type: "number",
      required: true,
      code: "matchNumber",
      defaultValue: "0",
    },
    {
      title: "Robot",
      type: "select",
      required: true,
      code: "robot",
      choices: {
        R1: "Red 1",
        R2: "Red 2",
        R3: "Red 3",
        B1: "Blue 1",
        B2: "Blue 2",
        B3: "Blue 3",
      },
      defaultValue: "R1",
    },
    {
      title: "Team Number",
      type: "number",
      required: true,
      code: "teamNumber",
      defaultValue: "0",
    },
    {
      title: "No Show",
      type: "checkbox",
      code: "noShow",
      defaultValue: false
    },
  ],
};

// =====================================================
// CONFIG LOADER
// =====================================================
class ConfigLoader {
  async loadConfigs() {
    try {
      const response = await fetch(`${CONFIG_PATH}configs.json`);
      const data = await response.json();
      return data.configs;
    } catch (error) {
      console.error("Error loading configs:", error);
      throw error;
    }
  }

  async loadSeasonConfig(fileName) {
    try {
      const response = await fetch(`${CONFIG_PATH}${fileName}`);
      return await response.json();
    } catch (error) {
      console.error("Error loading season config:", error);
      throw error;
    }
  }

  async loadCompetitionRefs(fileName) {
    const data = await this.loadSeasonConfig(fileName);
    return {
      refs: data.refs,
      year: data.year
    };
  }
}

// =====================================================
// UI MANAGER
// =====================================================
class UIManager {
  constructor(formElement) {
    this.form = formElement;
  }

  clearForm() {
    this.form.innerHTML = "";
  }

  static scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  populateConfigSelect(configs, currentVersion) {
    const select = document.getElementById("configSelect");
    select.innerHTML = configs.map(config => 
      `<option value="${config.file}">${config.name}</option>`
    ).join("");
    select.value = currentVersion;
  }

  populateCompSelect(refs) {
    const select = document.getElementById("compSelect");
    select.innerHTML = refs.map(ref =>
      `<option value="${ref.ref}">${ref.name}</option>`
    ).join("");
  }

  closeConfigSelector(){
    document.getElementsByClassName("config-selector-container")[0].style.display = "none";
  }

  renderSection(name, fields) {
    const sectionDiv = this.createElement(
      "div",
      "row center clearfix border-bottom content-style1"
    );

    const title = this.createElement("h4", "text-primary");
    title.innerText = name;
    title.style.textAlign = "center";
    sectionDiv.appendChild(title);

    const fieldContainer = this.createElement("div", "col-auto");
    sectionDiv.appendChild(fieldContainer);

    fields.forEach(field => {
      fieldContainer.appendChild(this.renderField(field));
    });

    this.form.appendChild(sectionDiv);
  }

  renderField(field) {
    const fieldFactories = {
      text: this.createTextBox.bind(this),
      number: this.createNumberInput.bind(this),
      checkbox: this.createCheckBox.bind(this),
      range: this.createRangeBox.bind(this),
      select: this.createSelectBox.bind(this),
      spinbox: this.createSpinBox.bind(this),
      clickImg: this.createClickImage.bind(this),
    };

    const factory = fieldFactories[field.type];
    if (!factory) {
      console.warn(`Unknown field type: ${field.type}`);
      return this.createElement("div");
    }

    return factory(field);
  }

  createElement(tag, classList = "") {
    const el = document.createElement(tag);
    if (classList) el.className = classList;
    return el;
  }

  // Field Creation Methods
  createTextBox({ code, title, defaultValue, required }) {
    const wrapper = this.createElement("div");
    wrapper.appendChild(this.createLabel(code, title));
    wrapper.appendChild(this.createInput("text", code, defaultValue, required));
    return wrapper;
  }

  createNumberInput({ code, title, defaultValue, required }) {
    const wrapper = this.createElement("div");
    wrapper.appendChild(this.createLabel(code, title));
    wrapper.appendChild(this.createInput("number", code, defaultValue, required));
    return wrapper;
  }

  createCheckBox({ code, title, defaultValue, required }) {
    const wrapper = this.createElement("div", "form-check");

    const input = this.createElement("input", "form-check-input reset");
    input.type = "checkbox";
    input.id = code;
    input.name = code;
    input.checked = defaultValue;
    input.dataset.default = defaultValue;
    input.required = required;

    const label = this.createElement("label", "form-check-label");
    label.htmlFor = code;
    label.innerText = title;

    wrapper.append(label, input);
    return wrapper;
  }

  createSpinBox({ code, title, min = 0, max = 500, step = 1, defaultValue = 0, required }) {
    const wrapper = this.createElement("div");
    wrapper.appendChild(this.createLabel(code, title));

    const spinBox = this.createElement("div", "input-group spinbox-group flex-nowrap center");
    spinBox.style.height = "25%"

    const input = this.createInput("number", code, defaultValue, required);
    input.min = min;
    input.max = max;
    input.step = step;
  
    const decrementBtn = this.createElement("button", "btn btn-primary");
    decrementBtn.style.width = "25%";
    decrementBtn.style.height = "25%";
    decrementBtn.type = "button";
    decrementBtn.textContent = "-";
    decrementBtn.onclick = () => this.changeSpinValue(code, -step, min, max);

    const incrementBtn = this.createElement("button", "btn btn-primary");
    incrementBtn.style.width = "25%";
    incrementBtn.style.height = "25%";
    incrementBtn.type = "button";
    incrementBtn.textContent = "+";
    incrementBtn.onclick = () => this.changeSpinValue(code, step, min, max);

    spinBox.append(decrementBtn, input, incrementBtn);
    wrapper.appendChild(spinBox);
    return wrapper;
  }

  createRangeBox({ code, title, min = 0, max = 10, step = 1, defaultValue = null, required }) {
    const wrapper = this.createElement("div");
    wrapper.appendChild(this.createLabel(code, title));

    const actualDefault = defaultValue ?? min;
    const range = this.createInput("range", code, actualDefault, required);
    range.min = min;
    range.max = max;
    range.step = step;

    const output = this.createElement("output", "form-label");
    output.textContent = actualDefault;

    range.addEventListener("input", () => {
      output.textContent = range.value;
    });

    wrapper.append(range, output);
    return wrapper;
  }

  createSelectBox({ code, title, choices, defaultValue, required }) {
    const wrapper = this.createElement("div");
    wrapper.appendChild(this.createLabel(code, title));

    const select = this.createElement("select", "form-select reset");
    select.id = code;
    select.name = code;
    select.dataset.default = defaultValue;
    select.required = required;

    Object.entries(choices).forEach(([key, text]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = text;
      select.appendChild(option);
    });

    select.value = defaultValue;
    wrapper.appendChild(select);
    return wrapper;
  }

  createClickImage({ code, title, img, defaultValue, required }) {
    const wrapper = this.createElement("div");
    wrapper.appendChild(this.createLabel(code, title));
    wrapper.classList = "center";

    const canvas = document.createElement("canvas");
    canvas.classList = "center";
    canvas.id = code;
    canvas.style.cursor = "crosshair";

    const imageHandler = new ClickImageHandler(canvas, img, appState);
    
    wrapper.appendChild(canvas);
    return wrapper;
  }

  // Helper Methods
  createLabel(forId, text) {
    const label = this.createElement("label", "form-label p-2");
    label.htmlFor = forId;
    label.innerText = text;
    return label;
  }

  createInput(type, id, value, required) {
    const input = this.createElement("input", "reset form-control");
    input.type = type;
    input.id = id;
    input.name = id;
    input.value = value;
    input.dataset.default = value;
    input.required = required;
    return input;
  }

  createButton(text, onClick) {
    const btn = this.createElement("button", "btn btn-primary");
    btn.type = "button";
    btn.textContent = text;
    btn.onclick = onClick;
    return btn;
  }

  changeSpinValue(id, delta, min, max) {
    const input = document.getElementById(id);
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.min(max, Math.max(min, currentValue + delta));
    input.value = newValue;
  }

  addFormButtons() {
    const submitDiv = this.createElement("div", "row mt-3 mb-3");
    const submit = this.createElement("input", "btn btn-primary d-block mt-2 center content-style1");
    submit.type = "submit";
    submitDiv.appendChild(submit);

    const resetDiv = this.createElement("div");
    const reset = this.createElement("input", "btn btn-secondary d-block mt-2 center content-style1");
    reset.type = "reset";
    reset.preventDefault = true;
    reset.onclick = (e) => UIManager.handleReset();
    resetDiv.appendChild(reset);

    const getKeys = this.createElement("input", "btn btn-secondary d-block mt-2 center content-style1");
    getKeys.type = "button";
    getKeys.value = "Get Form Keys";
    getKeys.onclick = () => this.logFormKeys();

    this.form.append(submitDiv, resetDiv, getKeys);
  }

  static handleReset() {
    document.querySelectorAll(".reset").forEach(element => {
      if (element.id === "matchNumber") {
        const num = parseInt(element.value);
        element.value = isNaN(num) ? 1 : num + 1;
        return;
      }

      if (element.type === "checkbox") {
        element.checked = element.dataset.default === "true";
        return;
      }

      if (element.tagName === "SELECT") {
        element.value = element.dataset.default;
        return;
      }

      element.value = element.dataset.default;

      if (element.type === "range") {
        const output = element.nextElementSibling;
        if (output) output.textContent = element.value;
      }
    });
  }

  logFormKeys() {
    const formData = new FormData(this.form);
    const formKeys = Object.keys(Object.fromEntries(formData.entries()));
    const state = appState.getState();
    
    formKeys.push("startingPos", "configVer", "competitionRef");
    console.log(formKeys.join(", "));
  }
}

// =====================================================
// CLICK IMAGE HANDLER
// =====================================================
class ClickImageHandler {
  constructor(canvas, img, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.state = state;
    this.currentImage = new Image();
    this.source = img
    
    this.init();
  }

  init() {
    this.currentImage.src = this.source;
    this.currentImage.onload = () => this.drawImage();

    this.canvas.addEventListener("click", (e) => this.handleClick(e));

    // Setup robot selection listener
    setTimeout(() => {
      const robotSelect = document.getElementById("robot");
      if (robotSelect) {
        robotSelect.addEventListener("change", () => this.handleRobotChange());
      }
    }, 100);
  }

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    this.state.setStartingPosition(x, y);
    this.drawImage();
    this.drawMarker(x, y);

    console.log(`Starting position set: (${x}, ${y})`);
  }

  handleRobotChange() {
    const robotSelect = document.getElementById("robot");
    if (!robotSelect) return;

    const isBlue = robotSelect.value.charAt(0) === "B";
    this.currentImage.src = img
    this.currentImage.onload = () => {
      this.state.setStartingPosition(0, 0);
      this.drawImage();
    };
  }

  drawImage() {
    this.canvas.width = this.currentImage.naturalWidth;
    this.canvas.height = this.currentImage.naturalHeight;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.currentImage, 0, 0);
  }

  drawMarker(x, y) {
    const radius = 32;
    
    this.ctx.fillStyle = isBlue ? "blue" : "red";
    this.ctx.beginPath();
    this.ctx.rect(x - radius / 2, y - radius / 2, radius, radius);
    this.ctx.fill();
  }
}

// =====================================================
// FORM HANDLER
// =====================================================
class FormHandler {
  constructor(formElement, state) {
    this.form = formElement;
    this.state = state;
  }

  setupSubmitHandler() {
    this.form.onsubmit = (e) => this.handleSubmit(e);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const state = this.state.getState();

    const submitData = {
      ...data,
      startingPos: `${state.startingPosition.x}, ${state.startingPosition.y}`,
      configVer: state.configVersion,
      competitionRef: document.getElementById("compSelect").value,
      year: state.year
    };

    console.log("Submitting Form Data:", submitData);

    try {
      const response = await fetch(`${API_URL}/submit-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ref": submitData.competitionRef,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        console.log("Form submitted successfully");
        UIManager.handleReset()
        UIManager.scrollToTop();
      } else {
        console.error("Form submission failed:", response.status);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }
}

// =====================================================
// APPLICATION CONTROLLER
// =====================================================
class AppController {
  constructor() {
    this.configLoader = new ConfigLoader();
    this.uiManager = new UIManager(document.querySelector(".formBody"));
    this.formHandler = new FormHandler(this.uiManager.form, appState);
  }

  async init() {
    await this.loadInitialConfigs();
    await this.buildWebsite();
    this.setupEventListeners();
  }

  async loadInitialConfigs() {
    try {
      const configs = await this.configLoader.loadConfigs();
      this.uiManager.populateConfigSelect(configs, appState.currentConfigVersion);
      await this.loadCompetitionRefs();
    } catch (error) {
      console.error("Failed to load initial configs:", error);
    }
  }

  async loadCompetitionRefs() {
    try {
      const selectedConfig = document.getElementById("configSelect").value;
      const { refs, year } = await this.configLoader.loadCompetitionRefs(selectedConfig);
      
      appState.setConfigVersion(selectedConfig);
      appState.setConfigYear(year);
      
      this.uiManager.populateCompSelect(refs);
    } catch (error) {
      console.error("Failed to load competition refs:", error);
    }
  }

  async buildWebsite() {
    try {
      const configData = await this.configLoader.loadSeasonConfig(appState.currentConfigVersion);
      
      this.uiManager.clearForm();
      this.uiManager.renderSection("Prematch", PREMATCH_CONFIG.fields);
      this.uiManager.createClickImage("startingPos", "Starting Position", configData.fieldImage, "", false);
      
      configData.sections.forEach(section => {
        this.uiManager.renderSection(section.name, section.fields);
      });
      
      this.uiManager.addFormButtons();
      this.formHandler.setupSubmitHandler();
    } catch (error) {
      console.error("Failed to build website:", error);
    }
  }

  setupEventListeners() {
    document.getElementById("closeConfigBtn").addEventListener("click", () => this.uiManager.closeConfigSelector());

    document.getElementById("loadConfigBtn").addEventListener("click", async (e) => {
      e.preventDefault();
      const selectedConfig = document.getElementById("configSelect").value;
      appState.setConfigVersion(selectedConfig);
      UIManager.scrollToTop();
      await this.buildWebsite();
      await this.loadCompetitionRefs();
    });

    document.getElementById("configSelect").addEventListener("change", () => {
      document.getElementById("loadConfigBtn").click();
    });
  }
}

// =====================================================
// APPLICATION INITIALIZATION
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  appState = new AppState();
  const app = new AppController();
  await app.init();
});
