const API_URL = "https://api-2sv4ordija-uc.a.run.app";
const CONFIG_PATH = "../configs/";

let scoutingData = [];
let selectedTeam = null;
let availableColumns = {};
let teams = {};
let datasets = {};
let currentConfigVersion = "2026.json";
let currentYearConfig = null; // the active config

var year = parseInt(currentConfigVersion.split(".")[0]);

const Utils = {
  num(val) {
    return parseFloat(val) || 0;
  },

  sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  },

  average(arr) {
    return arr.length ? this.sum(arr) / arr.length : 0;
  },

  getPercentile(value, sortedArray) {
    if (sortedArray.length === 0) return 0;

    let countBelow = 0;
    let countEqual = 0;
    const total = sortedArray.length;

    for (const item of sortedArray) {
      if (item < value) {
        countBelow++;
      } else if (item === value) {
        countEqual++;
      } else {
        break;
      }
    }

    const percentile = (countBelow + (0.5 * countEqual)) / total * 100;
    return percentile / 10;
  }
};

class ConfigLoader {
  async loadConfigs() {
    try {
      const response = await fetch(`${CONFIG_PATH}configs.json`);
      return await response.json();
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
}

class DataLoader {
  async loadFromServer(competitionRef, statusCallback) {
    try {
      statusCallback("Loading data from Google Sheets...", "text-muted");

      const response = await fetch(`${API_URL}/get-data`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ref": competitionRef
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        const entries = Object.values(data.data);
        statusCallback(
          `Successfully loaded ${entries.length} entries from Realtime Database`,
          "text-success"
        );
        console.log("Data loaded:", data);
        return entries;
      } else {
        statusCallback("No data available in " + competitionRef, "text-warning");
        console.error("No data available");
        return [];
      }
    } catch (error) {
      statusCallback("Failed to load data from Google Sheets", "text-danger");
      console.error("Error loading data:", error);
      return [];
    }
  }
}

class DataAggregator {
  aggregate(data, year) {
    if (!yearConfigRegistry.hasConfig(year)) {
      console.error(`No configuration available for year ${year}`);
      return { teams: {}, columns: {} };
    }

    currentYearConfig = yearConfigRegistry.get(year);

    teams = {};

    data.forEach(match => {
      const teamNum = match.teamNumber;
      currentYearConfig.updateTeamStats(teamNum, match, teams, Utils);
    });

    currentYearConfig.calculateAverages(teams);

    const columns = currentYearConfig.getColumns();

    return { teams, columns };
  }
}

// =====================================================
// UI CONTROLLER
// =====================================================
class UIController {
  constructor() {
    this.configSelect = document.getElementById("configSelect");
    this.compSelect = document.getElementById("compSelect");
  }

  populateConfigSelect(configs, currentVersion) {
    this.configSelect.innerHTML = configs.configs.map(config =>
      `<option value="${config.file}">${config.name}</option>`
    ).join("");
    this.configSelect.value = currentVersion;
  }

  populateCompSelect(refs) {
    this.compSelect.innerHTML = refs.map(ref =>
      `<option value="${ref.ref}">${ref.name}</option>`
    ).join("");
  }

  updateLoadingStatus(message, cssClass) {
    const statusElement = document.getElementById("loadingStatus");
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = cssClass;
    }
  }
}

// =====================================================
// APPLICATION CONTROLLER
// =====================================================
class DataAppController {
  constructor() {
    this.configLoader = new ConfigLoader();
    this.dataLoader = new DataLoader();
    this.aggregator = new DataAggregator();
    this.uiController = new UIController();
  }

  async init() {
    await this.loadInitialConfigs();
    this.setupEventListeners();
  }

  async loadInitialConfigs() {
    try {
      const configs = await this.configLoader.loadConfigs();
      this.uiController.populateConfigSelect(configs, currentConfigVersion);
      await this.loadCompetitionRefs();
    } catch (error) {
      console.error("Failed to load configs:", error);
    }
  }

  async loadCompetitionRefs() {
    try {
      currentConfigVersion = this.uiController.configSelect.value || currentConfigVersion;
      const seasonConfig = await this.configLoader.loadSeasonConfig(currentConfigVersion);
      this.uiController.populateCompSelect(seasonConfig.refs);
    } catch (error) {
      console.error("Failed to load competition refs:", error);
    }
  }

  async loadData() {
    const competitionRef = this.uiController.compSelect.value;

    scoutingData = await this.dataLoader.loadFromServer(
      competitionRef,
      (msg, cls) => this.uiController.updateLoadingStatus(msg, cls)
    );

    if (scoutingData.length > 0) {
      year = parseInt(currentConfigVersion.split(".")[0]);
      const { teams: aggregatedTeams, columns } = this.aggregator.aggregate(scoutingData, year);

      teams = aggregatedTeams;
      availableColumns = columns;

      return true;
    }

    return false;
  }

  setupEventListeners() {
    document.getElementById("loadDataBtn").addEventListener("click", async () => {
      const success = await this.loadData();
      if (success && typeof analyzeData === 'function') {
        analyzeData();
      }
    });

    this.uiController.configSelect.addEventListener("change", () => {
      this.loadCompetitionRefs();
    });
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================
function getTeamMatches(teamNumber) {
  return scoutingData.filter(match => match.teamNumber == teamNumber);
}

const num = Utils.num;
const sum = Utils.sum;
const average = Utils.average;
const getPercentile = Utils.getPercentile;

document.addEventListener("DOMContentLoaded", async () => {
  const app = new DataAppController();
  await app.init();
});
