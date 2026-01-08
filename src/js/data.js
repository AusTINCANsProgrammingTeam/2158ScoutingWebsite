let charts = {};
let currentSortColumn = 'avgTotalCoral';
let currentSortDirection = 'desc';
let selectedColumns = ['avgTotalCoral', 'avgTotalAlgae', 'climbRate', 'avgOffense', 'avgDefense'];

// TODO: Auto update columns based on available data
const availableColumns = {
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
};

function toggleLoader() {
    const card = document.getElementById('loaderCard');
    const btn = card.querySelector('button');
    
    if (card.style.display === 'none') {
        card.style.display = 'block';
        btn.textContent = 'Hide';
    } else {
        card.style.display = 'none';
        btn.textContent = 'Show';
    }
}

function populateTeamSelector() {
    const teams = [...new Set(scoutingData.map(d => d.teamNumber))].sort((a, b) => a - b);
    const select = document.getElementById('teamSelect');
    
    select.innerHTML = '<option value="">-- Select a Team --</option>' + 
        teams.map(team => `<option value="${team}">${team}</option>`).join('');
}

function updateTeamData() {
    const select = document.getElementById('teamSelect');
    selectedTeam = select.value;
    
    if (!selectedTeam) {
        document.getElementById('teamDetail').style.display = 'none';
        document.getElementById('chartsSection').style.display = 'none';
        return;
    }
    
    showTeamDetail(selectedTeam);
    createCharts();
    
    document.getElementById('teamDetail').style.display = 'block';
    document.getElementById('chartsSection').style.display = 'block';
}

function openColumnSelector() {
    const modal = document.getElementById('columnSelectorModal');
    const checkboxContainer = document.getElementById('columnCheckboxes');
    checkboxContainer.innerHTML = '';
    Object.keys(availableColumns).forEach(key => {
        const isChecked = selectedColumns.includes(key);
        const checkbox = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${key}" 
                       id="col_${key}" ${isChecked ? 'checked' : ''}>
                <label class="form-check-label" for="col_${key}">
                    ${availableColumns[key].label}
                </label>
            </div>
        `;
        checkboxContainer.innerHTML += checkbox;
    });
    
    modal.style.display = 'block';
}

function closeColumnSelector() {
    document.getElementById('columnSelectorModal').style.display = 'none';
}

function applyColumnSelection() {
    const checkboxes = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]');
    selectedColumns = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    if (selectedColumns.length === 0) {
        alert('Please select at least one column');
        return;
    }
    
    closeColumnSelector();
    displayTeamTable();
}

function sortTable(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'desc';
    }
    displayTeamTable();
}

function displayTeamTable() {
    const teamData = aggregateByTeam();
    
    // TODO: Calculate average scores and other derived metrics automatically instead of in browser
    Object.keys(teamData).forEach(team => {
        teamData[team].avgTotalScore = teamData[team].avgTeleopScore + teamData[team].avgAutoScore;
        teamData[team].avgAutoAlgae = teamData[team].totalAutoAlgae / teamData[team].matches;
        teamData[team].avgTeleAlgae = teamData[team].totalTeleAlgae / teamData[team].matches;
    });
    
    const sorted = Object.entries(teamData).sort((a, b) => {
        const aVal = a[1][currentSortColumn] || 0;
        const bVal = b[1][currentSortColumn] || 0;
        
        if (currentSortDirection === 'asc') {
            return aVal - bVal;
        } else {
            return bVal - aVal;
        }
    });

    const thead = document.getElementById('teamTableHead');
    const getSortIcon = (col) => {
        if (currentSortColumn !== col) return '↑↓';
        return currentSortDirection === 'asc' ? '↑' : '↓';
    };
    
    thead.innerHTML = `
        <tr>
            <th onclick="sortTable('rank')" style="cursor: pointer;">
                Rank ${getSortIcon('rank')}
            </th>
            <th onclick="sortTable('teamNumber')" style="cursor: pointer;">
                Team ${getSortIcon('teamNumber')}
            </th>
            ${selectedColumns.map(col => `
                <th onclick="sortTable('${col}')" style="cursor: pointer;">
                    ${availableColumns[col].label} ${getSortIcon(col)}
                </th>
            `).join('')}
            <th onclick="sortTable('matches')" style="cursor: pointer;">
                Matches ${getSortIcon('matches')}
            </th>
        </tr>
    `;

    // Build table body
    const tbody = document.getElementById('teamTableBody');
    tbody.innerHTML = sorted.map(([team, stats], index) => `
        <tr class="team-row" onclick="selectTeamFromTable('${team}')">
            <td>${index + 1}</td>
            <td>${team}</td>
            ${selectedColumns.map(col => `
                <td>${availableColumns[col].format(stats[col] || 0)}</td>
            `).join('')}
            <td>${stats.matches}</td>
        </tr>
    `).join('');
}

function selectTeamFromTable(team) {
    document.getElementById('teamSelect').value = team;
    updateTeamData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showTeamDetail(teamNumber) {
    const teamMatches = getTeamMatches(teamNumber);
    const teamStats = aggregateByTeam()[teamNumber];
    
    document.getElementById('detailTeamNumber').textContent = teamNumber;
    

    // TODO: Make Auto/Teleop scores not game specific
    const html = `
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="stat-box">
                    <p>Avg Teleop Score</p>
                    <h3>${teamStats.avgTeleopScore.toFixed(1)}</h3>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-box">
                    <p>Avg Auto Score</p>
                    <h3>${teamStats.avgAutoScore.toFixed(1)}</h3>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-box">
                    <p>Offense Rating</p>
                    <h3>${teamStats.avgOffense.toFixed(1)}</h3>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-box">
                    <p>Defense Rating</p>
                    <h3>${teamStats.avgDefense.toFixed(1)}</h3>
                </div>
            </div>
        </div>
        <h4 class="mb-0">Match History</h4>
        <div class="table-responsive">
            <table class="table table-dark table-sm">
                <thead>
                    <tr>
                        <th>Match</th>
                        <th>Auto Coral</th>
                        <th>Tele Coral</th>
                        <th>Algae</th>
                        <th>Endgame</th>
                        <th>Fouls</th>
                    </tr>
                </thead>
                <tbody>
                    ${teamMatches.map(m => `
                        <tr>
                            <td>${m.matchNumber}</td>
                            <td>${num(m.AutoCorL1) + num(m.AutoCorL2) + num(m.AutoCorL3) + num(m.AutoCorL4)}</td>
                            <td>${num(m.TeleCorL1) + num(m.TeleCorL2) + num(m.TeleCorL3) + num(m.TeleCorL4)}</td>
                            <td>${num(m.AutoAlgProcess) + num(m.AutoAlgNet) + num(m.TeleAlgProcess) + num(m.TeleAlgNet)}</td>
                            <td>${m.endgamePos}</td>
                            <td>${m.Fouls}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('teamDetailBody').innerHTML = html;
    document.getElementById('teamDetail').style.display = 'block';
    document.getElementById('teamDetail').scrollIntoView({ behavior: 'smooth' });
}


//TODO: Use Factory Design Pattern for creation of charts
function createCharts() {
    if (!selectedTeam) return;
    
    Object.values(charts).forEach(chart => chart?.destroy());

    const teamData = getTeamMatches(selectedTeam);
    const matchNumbers = [...new Set(teamData.map(d => num(d.matchNumber)))].sort((a, b) => a - b);
    
    createScoringChart(teamData, matchNumbers);
    createScoreByTypeChart(teamData, matchNumbers);
    createRadarChart();
    renderPenaltyTable();
}

function createScoringChart(teamData, matchNumbers) {
    const autoScores = matchNumbers.map(match => {
        const matchData = teamData.filter(d => num(d.matchNumber) === match);
        return sum(matchData.map(d => 
            num(d.AutoCorL1) * 3 + 
            num(d.AutoCorL2) * 4 + 
            num(d.AutoCorL3) * 6 + 
            num(d.AutoCorL4) * 7 +
            num(d.AutoAlgProcess) * 6 +
            num(d.AutoAlgNet) * 4
        ));
    });

    const teleopScores = matchNumbers.map(match => {
        const matchData = teamData.filter(d => num(d.matchNumber) === match);
        return sum(matchData.map(d => 
            num(d.TeleCorL1) * 2 + 
            num(d.TeleCorL2) * 3 + 
            num(d.TeleCorL3) * 4 + 
            num(d.TeleCorL4) * 5 +
            num(d.TeleAlgProcess) * 6 +
            num(d.TeleAlgNet) * 4
        ));
    });

    charts.scoring = new Chart(document.getElementById('scoringChart'), {
        type: 'bar',
        data: {
            labels: matchNumbers.map(m => `Match ${m}`),
            datasets: [{
                label: 'Auto',
                data: autoScores,
                backgroundColor: '#FFF01F',
                borderColor: '#FFF01F',
                borderWidth: 1
            }, {
                label: 'Teleop',
                data: teleopScores,
                backgroundColor: '#0dcaf0',
                borderColor: '#0dcaf0',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Points' }
                },
                x: {
                    title: { display: true, text: 'Match Number' }
                }
            }
        }
    });
}

function createScoreByTypeChart(teamData, matchNumbers) {
    const l1Scores = matchNumbers.map(match => {
        const matchData = teamData.filter(d => num(d.matchNumber) === match);
        return sum(matchData.map(d => num(d.TeleCorL1)));
    });
    
    const l2Scores = matchNumbers.map(match => {
        const matchData = teamData.filter(d => num(d.matchNumber) === match);
        return sum(matchData.map(d => num(d.TeleCorL2)));
    });
    
    const l3Scores = matchNumbers.map(match => {
        const matchData = teamData.filter(d => num(d.matchNumber) === match);
        return sum(matchData.map(d => num(d.TeleCorL3)));
    });
    
    const l4Scores = matchNumbers.map(match => {
        const matchData = teamData.filter(d => num(d.matchNumber) === match);
        return sum(matchData.map(d => num(d.TeleCorL4)));
    });

    charts.scoreByType = new Chart(document.getElementById('scoreByTypePerRound'), {
        type: 'bar',
        data: {
            labels: matchNumbers.map(m => `M${m}`),
            datasets: [{
                label: 'L1',
                data: l1Scores,
                backgroundColor: '#FFF01F'
            }, {
                label: 'L2',
                data: l2Scores,
                backgroundColor: '#0dcaf0'
            }, {
                label: 'L3',
                data: l3Scores,
                backgroundColor: '#198754'
            }, {
                label: 'L4',
                data: l4Scores,
                backgroundColor: '#dc3545'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Amount Scored' }
                },
                x: {
                    title: { display: true, text: 'Match' }
                }
            }
        }
    });
}

function createRadarChart() {
    const allTeamData = aggregateByTeam();
    const thisTeam = allTeamData[selectedTeam];
    
    // TODO: Calculate in server and save to database instead of in browser
    const allOffense = Object.values(allTeamData).map(t => t.avgOffense).sort((a, b) => a - b);
    const allDefense = Object.values(allTeamData).map(t => t.avgDefense).sort((a, b) => a - b);
    const allTeleop = Object.values(allTeamData).map(t => t.avgTeleCoral).sort((a, b) => a - b);
    const allAuto = Object.values(allTeamData).map(t => t.avgAutoCoral).sort((a, b) => a - b);
    const allClimb = Object.values(allTeamData).map(t => t.climbRate).sort((a, b) => a - b);

    charts.radar = new Chart(document.getElementById('radarChart'), {
        type: 'radar',
        data: {
            labels: ['Defense', 'Offense', 'Teleop Coral', 'Auto Coral', 'Climb Rate'],
            datasets: [{
                label: 'Team Percentile',
                data: [
                    getPercentile(thisTeam.avgDefense, allDefense),
                    getPercentile(thisTeam.avgOffense, allOffense),
                    getPercentile(thisTeam.avgTeleCoral, allTeleop),
                    getPercentile(thisTeam.avgAutoCoral, allAuto),
                    getPercentile(thisTeam.climbRate, allClimb)
                ],
                backgroundColor: 'rgba(255, 240, 31, 0.2)',
                borderColor: '#FFF01F',
                borderWidth: 2,
                pointBackgroundColor: '#FFF01F',
                pointBorderColor: '#CCBE00',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        display: true
                    },
                    pointLabels: {
                        font: {
                            size: 14 
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Percentile: ${context.parsed.r.toFixed(1)}/10`;
                        }
                    }
                }
            }
        }
    });
}

function renderPenaltyTable() {
    const penaltyMatches = getPenaltyMatches(selectedTeam);
    const tbody = document.getElementById('penaltyTableBody');
    
    if (penaltyMatches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No penalties recorded</td></tr>';
        return;
    }
    
    tbody.innerHTML = penaltyMatches.map(p => `
        <tr>
            <td>${p.match}</td>
            <td>${p.team}</td>
            <td>${p.penalty}</td>
        </tr>
    `).join('');
}

window.onclick = function(event) {
    const modal = document.getElementById('columnSelectorModal');
    if (event.target === modal) {
        closeColumnSelector();
    }
}