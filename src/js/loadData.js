let scoutingData = [];
let selectedTeam = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromServer();
});

async function loadDataFromServer() {
    const statusEl = document.getElementById('loadingStatus');
    
    try {
        statusEl.textContent = 'Loading data from Google Sheets...';
        statusEl.className = 'mb-2 text-muted';
        
        const response = await fetch('/get-data');
        const data = await response.json();
        
        if (data.success && data.rows.length > 0) {
            scoutingData = data.rows;
            statusEl.textContent = `Successfully loaded ${data.rows.length} entries from Google Sheets`;
            statusEl.className = 'mb-2 text-success';
            analyzeData();
        } else {
            statusEl.textContent = 'No data available in Google Sheets';
            statusEl.className = 'mb-2 text-warning';
            console.error('No data available');
        }
    } catch (error) {
        statusEl.textContent = 'Failed to load data from Google Sheets';
        statusEl.className = 'mb-2 text-danger';
        console.error('Error loading data:', error);
    }
}

function analyzeData() {
    if (scoutingData.length === 0) return;

    populateTeamSelector();
    displayTeamTable();
    
    document.getElementById('teamSelector').style.display = 'block';
    document.getElementById('teamTable').style.display = 'block';
}

function aggregateByTeam() {
    const teams = {};
    
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
                totalDefense: 0
            };
        }
        
        teams[team].matches++;
        teams[team].totalAutoCoral += num(d.AutoCorL1) + num(d.AutoCorL2) + num(d.AutoCorL3) + num(d.AutoCorL4);
        teams[team].totalTeleCoral += num(d.TeleCorL1) + num(d.TeleCorL2) + num(d.TeleCorL3) + num(d.TeleCorL4);
        teams[team].totalAutoAlgae += num(d.AutoAlgProcess) + num(d.AutoAlgNet);
        teams[team].totalTeleAlgae += num(d.TeleAlgProcess) + num(d.TeleAlgNet);
        teams[team].totalTeleopScore += num(d.TeleCorL1) * 2 + 
            num(d.TeleCorL2) * 3 + 
            num(d.TeleCorL3) * 4 + 
            num(d.TeleCorL4) * 5 +
            num(d.TeleAlgProcess) * 6 +
            num(d.TeleAlgNet) * 4;
        teams[team].totalAutoScore += num(d.AutoCorL1) * 3 + 
            num(d.AutoCorL2) * 4 + 
            num(d.AutoCorL3) * 6 + 
            num(d.AutoCorL4) * 7 +
            num(d.AutoAlgProcess) * 6 +
            num(d.AutoAlgNet) * 4;
        teams[team].climbs += (d.endgamePos === 'Sh' || d.endgamePos === 'Os') ? 1 : 0;
        teams[team].totalOffense += num(d.offskillrate);
        teams[team].totalDefense += num(d.defskillrate);
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

    return teams;
}

function getTeamMatches(teamNumber) {
    return scoutingData.filter(d => d.teamNumber == teamNumber);
}

function getPenaltyMatches(teamNumber) {
    const teamData = getTeamMatches(teamNumber);
    const penaltyMatches = [];
    
    teamData.forEach(d => {
        const penalties = [];
        if (num(d.Fouls) > 0) penalties.push(`Fouls (${d.Fouls})`);
        if (d.AutoFoul === 'true') penalties.push('Auto Foul');
        if (d.YRCard === 'true') penalties.push('Yellow/Red Card');
        if (d.Died === 'true') penalties.push('Died');
        if (d.Tipped === 'true') penalties.push('Tipped');
        
        penalties.forEach(penalty => {
            penaltyMatches.push({
                match: d.matchNumber,
                team: d.teamNumber,
                penalty: penalty
            });
        });
    });
    
    return penaltyMatches;
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
    return percentile/10;
}