let scoutingData = [];
let selectedTeam = null;
var apiUrl = "https://api-2sv4ordija-uc.a.run.app";

// TODO: Auto update columns based on available data
var availableColumns = {};
var teams = {};

var currentConfigVersion = "2026.json";

document.addEventListener('DOMContentLoaded', () => {
    loadConfigs()
    loadRefs()
    document.getElementById("loadDataBtn").addEventListener("click", async () => {
        if (await loadFromServer((status, statusClass) => {
            const statusElement = document.getElementById("loadingStatus");
            statusElement.textContent = status;
            statusElement.className = statusClass;
        })) {
            configYear = parseInt(document.getElementById("configSelect").value.split(".")[0]);
            aggregate(configYear);
        }
        analyzeData();
    })
    document
    .getElementById("configSelect")
    .addEventListener("change", function (e) {
      loadRefs();
    });
});

async function loadConfigs() {
    let request = await fetch("../configs/configs.json")
    let configs = await request.json()
    document.getElementById("configSelect").innerHTML = "";
    configs.configs.forEach((config) => {
        let option = document.createElement("option");
        option.value = config.file;
        option.textContent = config.name;
        document.getElementById("configSelect").appendChild(option);
        document.getElementById("configSelect").value = currentConfigVersion;
    });
}

async function loadRefs() {
    currentConfigVersion = document.getElementById("configSelect").value ?? currentConfigVersion;
    document.getElementById("compSelect").innerHTML = "";

    const response = await fetch("../configs/" + currentConfigVersion);
    const data = await response.json();
    data.refs.forEach((ref) => {
        let option = document.createElement("option");
        option.value = ref.ref;
        option.textContent = ref.name;
        document.getElementById("compSelect").appendChild(option);
        document.getElementById("compSelect").value = ref.ref;
    });
}

/**
 * 
 * @param {function} statusCallback
 * @returns {boolean}
 */
async function loadFromServer(statusCallback) {
    try {
        statusCallback('Loading data from Google Sheets...', 'text-muted');
        let options = {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                'ref': document.getElementById("compSelect").value
            }
        }
        const response = await fetch(`${apiUrl}/get-data`, options);
        const data = await response.json();

        if (data.success) {
            scoutingData = Object.values(data.data)
            statusCallback(
                `Successfully loaded ${Object.keys(data.data).length} entries from Realtime Database`,
                'text-success'
            );
            console.log('Data loaded:', data);
            return true;
        } else {
            statusCallback('No data available in Google Sheets', 'text-warning');
            console.error('No data available');
            return false;
        }
    } catch (error) {
        statusCallback('Failed to load data from Google Sheets', 'text-danger');
        console.error('Error loading data:', error);
        return false;
    }
}

/** TODO: remember to update each year with each season
 * Aggegrates data based on scoring for each year
 * 
 * Assumes that scouting data is already loaded into scoutingData
 * @param {number} year - Competition year
 */

function aggregate(year) {
    teams = {};
    if (year === 2026) {
        scoutingData.forEach(d => {
            const team = d.teamNumber;
            if (!teams[team]) {
                teams[team] = {
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
            }

            teams[team].matches++;
            teams[team].totalAutoCoral += sum([num(d.AutoCorL1), num(d.AutoCorL2), num(d.AutoCorL3), num(d.AutoCorL4)]);
            teams[team].totalTeleCoral += sum([num(d.TeleCorL1), num(d.TeleCorL2), num(d.TeleCorL3), num(d.TeleCorL4)]);
            teams[team].totalAutoAlgae += sum([num(d.AutoAlgProcess), num(d.AutoAlgNet)]);
            teams[team].totalTeleAlgae += sum([num(d.TeleAlgProcess), num(d.TeleAlgNet)]);
            teams[team].totalTeleopScore += sum([
                num(d.TeleCorL1) * 2,
                num(d.TeleCorL2) * 3,
                num(d.TeleCorL3) * 4,
                num(d.TeleCorL4) * 5,
                num(d.TeleAlgProcess) * 6,
                num(d.TeleAlgNet) * 4
            ]);
            teams[team].totalAutoScore += sum([
                num(d.AutoCorL1) * 3,
                num(d.AutoCorL2) * 4,
                num(d.AutoCorL3) * 6,
                num(d.AutoCorL4) * 7,
                num(d.AutoAlgProcess) * 6,
                num(d.AutoAlgNet) * 4
            ]);
            teams[team].climbs += (d.endgamePos === 'Sh' || d.endgamePos === 'Os') ? 1 : 0;
            teams[team].totalOffense += num(d.offskillrate);
            teams[team].totalDefense += num(d.defskillrate);

            var penalty = {
                match: d.matchNumber,
                team: d.teamNumber,
                penalties: []
            };
            if (num(d.Fouls) > 0) penalty.penalties.push(`Fouls (${d.Fouls})`);
            if (d.AutoFoul === 'true') penalty.penalties.push('Auto Foul');
            if (d.YRCard === 'true') penalty.penalties.push('Yellow/Red Card');
            if (d.Died === 'true') penalty.penalties.push('Died');
            if (d.Tipped === 'true') penalty.penalties.push('Tipped');
            teams[team].penaltyMatches.push(penalty);
        });

        Object.keys(teams).forEach(team => {
            const t = teams[team];
            t.avgAutoCoral = t.totalAutoCoral / t.matches;
            t.avgTeleCoral = t.totalTeleCoral / t.matches;
            t.avgTotalCoral = (t.totalAutoCoral + t.totalTeleCoral) / t.matches;
            t.avgTotalAlgae = (t.totalAutoAlgae + t.totalTeleAlgae) / t.matches;
            t.avgTeleopScore = t.totalTeleopScore / t.matches;
            t.avgAutoScore = t.totalAutoScore / t.matches;
            t.climbRate = (t.climbs / t.matches) * 100;
            t.avgOffense = t.totalOffense / t.matches;
            t.avgDefense = t.totalDefense / t.matches;
        });

        availableColumns = {
            'avgTotalCoral': { label: 'Avg Coral', format: (val) => val.toFixed(1) },
            'avgAutoCoral': { label: 'Avg Auto Coral', format: (val) => val.toFixed(1) },
            'avgTeleCoral': { label: 'Avg Tele Coral', format: (val) => val.toFixed(1) },
            'avgTotalAlgae': { label: 'Avg Algae', format: (val) => val.toFixed(1) },
            'avgAutoAlgae': { label: 'Avg Auto Algae', format: (val) => val.toFixed(1) },
            'avgTeleAlgae': { label: 'Avg Tele Algae', format: (val) => val.toFixed(1) },
            'climbRate': { label: 'Climb %', format: (val) => val.toFixed(0) + '%' },
            'avgOffense': { label: 'Offense', format: (val) => val.toFixed(1) },
            'avgDefense': { label: 'Defense', format: (val) => val.toFixed(1) },
            'avgTeleopScore': { label: 'Avg Teleop Score', format: (val) => val.toFixed(1) },
            'avgAutoScore': { label: 'Avg Auto Score', format: (val) => val.toFixed(1) },
            'avgTotalScore': { label: 'Avg Total Score', format: (val) => val.toFixed(1) },
            'matches': { label: 'Matches', format: (val) => val }
        }
    }
}

function getTeamMatches(teamNumber) {
    return scoutingData.filter(d => d.teamNumber == teamNumber);
}


// UTILITY
function num(val) {
    return parseFloat(val) || 0;
}

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

function average(arr) {
    return arr.length ? sum(arr) / arr.length : 0;
}

function getPercentile(value, arr) {
    if (arr.length === 0) return 0;

    let countBelow = 0;
    let countEqual = 0;
    const N = arr.length;

    for (let i = 0; i < N; i++) {
        if (arr[i] < value) {
            countBelow++;
        } else if (arr[i] === value) {
            countEqual++;
        } else {
            break;
        }
    }

    const percentile = (countBelow + (0.5 * countEqual)) / N * 100;
    return percentile / 10;
}