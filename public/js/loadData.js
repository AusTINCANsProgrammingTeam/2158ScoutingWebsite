const API_URL = "https://api-2sv4ordija-uc.a.run.app";
const CONFIG_PATH = "../configs/";

let scoutingData = [];
let selectedTeam = null;
let availableColumns = {};
let teams = {};
let datasets = {};
let currentConfigVersion = "2026.json";

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
    const aggregators = {
      2025: this.aggregate2025.bind(this),
      2026: this.aggregate2026.bind(this)
    };

    const aggregator = aggregators[year];
    if (!aggregator) {
      console.warn(`No aggregator found for year ${year}`);
      return { teams: {}, columns: {} };
    }

    return aggregator(data);
  }

  aggregate2025(data) {
    data.forEach(match => {
      const teamNum = match.teamNumber;

      this.updateTeamStats2025(teamNum, match);
    });

    this.calculateAverages2025(teams);

    const columns = {
      'avgTotalCoral': { label: 'Avg Coral', format: (val) => val.toFixed(1) },
      'avgAutoCoral': { label: 'Avg Auto Coral', format: (val) => val.toFixed(1) },
      'avgTeleCoral': { label: 'Avg Tele Coral', format: (val) => val.toFixed(1) },
      'avgTotalAlgae': { label: 'Avg Algae', format: (val) => val.toFixed(1) },
      'climbRate': { label: 'Climb %', format: (val) => val.toFixed(0) + '%' },
      'avgOffense': { label: 'Offense', format: (val) => val.toFixed(1) },
      'avgDefense': { label: 'Defense', format: (val) => val.toFixed(1) },
      'avgTeleopScore': { label: 'Avg Teleop Score', format: (val) => val.toFixed(1) },
      'avgAutoScore': { label: 'Avg Auto Score', format: (val) => val.toFixed(1) },
      'avgTotalScore': { label: 'Avg Total Score', format: (val) => val.toFixed(1) },
      'matches': { label: 'Matches', format: (val) => val }
    };

    return { teams, columns };
  }

  aggregate2026(data) {
    data.forEach(match => {
      const teamNum = match.teamNumber;

      this.updateTeamStats2026(teamNum, match);
    });

    this.calculateAverages2026(teams);

    const columns = {
      'avgTotalScore': { label: 'Avg Total Score', format: (val) => val.toFixed(1) },
      'avgTotalFuel': { label: 'Avg Fuel', format: (val) => val.toFixed(1) },
      'avgAutoFuel': { label: 'Avg Auto Fuel', format: (val) => val.toFixed(1) },
      'avgTeleFuel': { label: 'Avg Tele Fuel', format: (val) => val.toFixed(1) },
      'climbRate': { label: 'Climb %', format: (val) => val.toFixed(0) + '%' },
      'avgOffense': { label: 'Offense', format: (val) => val.toFixed(1) },
      'avgDefense': { label: 'Defense', format: (val) => val.toFixed(1) },
      'avgTeleopScore': { label: 'Avg Teleop Score', format: (val) => val.toFixed(1) },
      'avgAutoScore': { label: 'Avg Auto Score', format: (val) => val.toFixed(1) },
      'matches': { label: 'Matches', format: (val) => val }
    };

    return { teams, columns };
  }

  updateTeamStats2025(teamNum, match) {
    const { num, sum } = Utils;
    teams[teamNum] = teams[teamNum] || {
      matches: 0,
      totalAutoCoral: 0,
      totalTeleCoral: 0,
      totalAutoAlgae: 0,
      totalTeleAlgae: 0,
      totalTeleopScore: 0,
      totalAutoScore: 0,
      climbs: 0,
      totalOffense: 0,
      totalDefense: 0,
      penaltyMatches: []
    };

    var teamStats = teams[teamNum];
    teamStats.matches++;

    // Coral
    teamStats.totalAutoCoral += sum([
      num(match.AutoCorL1),
      num(match.AutoCorL2),
      num(match.AutoCorL3),
      num(match.AutoCorL4)
    ]);

    teamStats.totalTeleCoral += sum([
      num(match.TeleCorL1),
      num(match.TeleCorL2),
      num(match.TeleCorL3),
      num(match.TeleCorL4)
    ]);

    // Algae
    teamStats.totalAutoAlgae += sum([
      num(match.AutoAlgProcess),
      num(match.AutoAlgNet)
    ]);

    teamStats.totalTeleAlgae += sum([
      num(match.TeleAlgProcess),
      num(match.TeleAlgNet)
    ]);

    // Point calculations
    teamStats.totalTeleopScore += sum([
      num(match.TeleCorL1) * 2,
      num(match.TeleCorL2) * 3,
      num(match.TeleCorL3) * 4,
      num(match.TeleCorL4) * 5,
      num(match.TeleAlgProcess) * 6,
      num(match.TeleAlgNet) * 4
    ]);

    teamStats.totalAutoScore += sum([
      num(match.AutoCorL1) * 3,
      num(match.AutoCorL2) * 4,
      num(match.AutoCorL3) * 6,
      num(match.AutoCorL4) * 7,
      num(match.AutoAlgProcess) * 6,
      num(match.AutoAlgNet) * 4
    ]);

    // Endgame
    teamStats.climbs += (match.endgamePos === 'Sh' || match.endgamePos === 'Os') ? 1 : 0;

    // Skills
    teamStats.totalOffense += num(match.offskillrate);
    teamStats.totalDefense += num(match.defskillrate);

    // Penalties
    this.addPenalties(teamStats, match);
  }

  updateTeamStats2026(teamNum, match) {
    const { num, sum } = Utils;
    teams[teamNum] = teams[teamNum] || {
      matches: 0,
      totalAutoFuel: 0,
      totalTeleFuel: 0,
      totalTeleopScore: 0,
      totalAutoScore: 0,
      climbs: 0,
      totalOffense: 0,
      totalDefense: 0,
      penaltyMatches: []
    }
    var teamStats = teams[teamNum];
    teamStats.matches++;
    console.log(match)

    // Fuel
    teamStats.totalAutoFuel += sum([
      num(match.AutoFuelScore)
    ]);

    teamStats.totalTeleFuel += sum([
      num(match.TeleFuelScore)
    ]);

    // Point calculations
    teamStats.totalTeleopScore += sum([
      num(match.TeleFuelScore)
    ]);

    teamStats.totalAutoScore += sum([
      num(match.AutoFuelScore),
      num(match.AutoClimb) * 15
    ]);

    // Endgame
    teamStats.climbs += (
      match.endgamePos === 'L1' ||
      match.endgamePos === 'L2' ||
      match.endgamePos === 'L3'
    ) ? 1 : 0;

    // Skills
    teamStats.totalOffense += num(match.offskillrate);
    teamStats.totalDefense += num(match.defskillrate);

    // Penalties
    this.addPenalties(teamStats, match);
  }

  addPenalties(teamStats, match) {
    const penalty = {
      match: match.matchNumber,
      team: match.teamNumber,
      penalties: []
    };

    if (Utils.num(match.Fouls) > 0) {
      penalty.penalties.push(`Fouls (${match.Fouls})`);
    }
    if (Utils.num(match.majorFoul) > 0) {
      penalty.penalties.push(`Major Fouls (${match.majorFoul})`);
    }
    if (Utils.num(match.minorFoul) > 0) {
      penalty.penalties.push(`Minor Fouls (${match.minorFoul})`);
    }
    if (match.AutoFoul === 'true' || match.AutoFoul === 'on') {
      penalty.penalties.push('Auto Foul');
    }
    if (match.YRCard === 'true' || match.YRCard === 'on') {
      penalty.penalties.push('Yellow/Red Card');
    }
    if (match.Died === 'true' || match.Died === 'on') {
      penalty.penalties.push('Died');
    }
    if (match.Tipped === 'true' || match.Tipped === 'on') {
      penalty.penalties.push('Tipped');
    }

    if (penalty.penalties.length > 0) {
      teamStats.penaltyMatches.push(penalty);
    }
  }

  calculateAverages2025(teams) {
    Object.values(teams).forEach(team => {
      const matches = team.matches || 1;

      team.avgAutoCoral = team.totalAutoCoral / matches;
      team.avgTeleCoral = team.totalTeleCoral / matches;
      team.avgTotalCoral = (team.totalAutoCoral + team.totalTeleCoral) / matches;
      team.avgAutoAlgae = team.totalAutoAlgae / matches;
      team.avgTeleAlgae = team.totalTeleAlgae / matches;
      team.avgTotalAlgae = (team.totalAutoAlgae + team.totalTeleAlgae) / matches;
      team.avgTeleopScore = team.totalTeleopScore / matches;
      team.avgAutoScore = team.totalAutoScore / matches;
      team.avgTotalScore = (team.totalAutoScore + team.totalTeleopScore) / matches;
      team.climbRate = (team.climbs / matches) * 100;
      team.avgOffense = team.totalOffense / matches;
      team.avgDefense = team.totalDefense / matches;
    });
  }

  calculateAverages2026(teams) {
    Object.values(teams).forEach(team => {
      const matches = team.matches || 1;

      team.avgFuel = team.totalFuel / matches;
      team.avgTeleFuel = team.totalTeleFuel / matches;
      team.avgTeleopScore = team.totalTeleopScore / matches;
      team.avgAutoScore = team.totalAutoScore / matches;
      team.avgTotalScore = (team.totalAutoScore + team.totalTeleopScore) / matches;
      team.climbRate = (team.climbs / matches) * 100;
      team.avgOffense = team.totalOffense / matches;
      team.avgDefense = team.totalDefense / matches;
    });
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
