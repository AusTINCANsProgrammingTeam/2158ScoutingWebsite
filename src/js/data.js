let scoutingData = [];
let charts = {};
let selectedTeam = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromServer();
});

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

async function loadDataFromServer() {
    const statusEl = document.getElementById('loadingStatus');
    
    try {
        statusEl.textContent = 'Loading data from Google Sheets...';
        statusEl.className = 'mb-2 text-muted';
        
        const response = await fetch('/get-data');
        const data = await response.json();
        
        if (data.success && data.rows.length > 0) {
            scoutingData = data.rows;
            statusEl.textContent = `Successfully loaded ${data.rows.length} matches from Google Sheets`;
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

function generateSampleData() {
    const teams = [1234, 5678, 9012, 3456, 7890];
    const robots = ['R1', 'R2', 'R3', 'B1', 'B2', 'B3'];
    const endPositions = ['No', 'Pr', 'Sh', 'Os'];
    
    scoutingData = [];
    
    for (let match = 1; match <= 20; match++) {
        for (let i = 0; i < 3; i++) {
            const team = teams[Math.floor(Math.random() * teams.length)];
            scoutingData.push({
                matchNumber: match,
                robot: robots[i],
                teamNumber: team,
                noShow: Math.random() < 0.05 ? 'true' : 'false',
                AutoCorL1: Math.floor(Math.random() * 3),
                AutoCorL2: Math.floor(Math.random() * 3),
                AutoCorL3: Math.floor(Math.random() * 2),
                AutoCorL4: Math.floor(Math.random() * 2),
                AutoCorMissL4: Math.floor(Math.random() * 2),
                AutoAlgProcess: Math.floor(Math.random() * 4),
                AutoAlgNet: Math.floor(Math.random() * 3),
                AutoFoul: Math.random() < 0.1 ? 'true' : 'false',
                AutoLeave: Math.random() < 0.7 ? 'true' : 'false',
                TeleCorL1: Math.floor(Math.random() * 8),
                TeleCorL2: Math.floor(Math.random() * 6),
                TeleCorL3: Math.floor(Math.random() * 5),
                TeleCorL4: Math.floor(Math.random() * 4),
                TeleCorMissL4: Math.floor(Math.random() * 3),
                TeleAlgProcess: Math.floor(Math.random() * 10),
                TeleAlgNet: Math.floor(Math.random() * 8),
                endgamePos: endPositions[Math.floor(Math.random() * endPositions.length)],
                CoralPickLoc: ['N', 'G', 'S', 'B'][Math.floor(Math.random() * 4)],
                AlgaePickLoc: ['X', 'G', 'R', 'B'][Math.floor(Math.random() * 4)],
                Fouls: Math.floor(Math.random() * 3),
                Died: Math.random() < 0.05 ? 'true' : 'false',
                Tipped: Math.random() < 0.03 ? 'true' : 'false',
                YRCard: Math.random() < 0.02 ? 'true' : 'false',
                offskillrate: Math.floor(Math.random() * 7) + 1,
                defskillrate: Math.floor(Math.random() * 7) + 1,
                comments: ''
            });
        }
    }

    analyzeData();
}

function analyzeData() {
    if (scoutingData.length === 0) return;

    populateTeamSelector();
    displayTeamTable();
    
    document.getElementById('teamSelector').style.display = 'block';
    document.getElementById('teamTable').style.display = 'block';
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
        document.getElementById('summaryStats').style.display = 'none';
        document.getElementById('chartsSection').style.display = 'none';
        return;
    }
    
    displaySummaryStats();
    createCharts();
    
    document.getElementById('summaryStats').style.display = 'block';
    document.getElementById('chartsSection').style.display = 'block';
}

function displayTeamTable() {
    const teamData = aggregateByTeam();
    const sorted = Object.entries(teamData).sort((a, b) => 
        (b[1].avgTotalCoral) - (a[1].avgTotalCoral)
    );

    const tbody = document.getElementById('teamTableBody');
    tbody.innerHTML = sorted.map(([team, stats], index) => `
        <tr class="team-row" onclick="selectTeamFromTable('${team}')">
            <td>${index + 1}</td>
            <td>${team}</td>
            <td>${stats.avgTotalCoral.toFixed(1)}</td>
            <td>${stats.avgTotalAlgae.toFixed(1)}</td>
            <td>${stats.climbRate.toFixed(0)}%</td>
            <td>${stats.avgOffense.toFixed(1)}</td>
            <td>${stats.avgDefense.toFixed(1)}</td>
            <td>${stats.matches}</td>
        </tr>
    `).join('');
}

function selectTeamFromTable(team) {
    document.getElementById('teamSelect').value = team;
    updateTeamData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        t.climbRate = (t.climbs / t.matches) * 100;
        t.avgOffense = t.totalOffense / t.matches;
        t.avgDefense = t.totalDefense / t.matches;
    });

    return teams;
}

function showTeamDetail(teamNumber) {
    const teamMatches = scoutingData.filter(d => d.teamNumber == teamNumber);
    const teamStats = aggregateByTeam()[teamNumber];
    
    document.getElementById('detailTeamNumber').textContent = teamNumber;
    
    const html = `
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="stat-box">
                    <p>Avg Auto Coral</p>
                    <h3>${teamStats.avgAutoCoral.toFixed(1)}</h3>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-box">
                    <p>Avg Teleop Coral</p>
                    <h3>${teamStats.avgTeleCoral.toFixed(1)}</h3>
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
        <h4>Match History</h4>
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

function num(val) {
    return parseFloat(val) || 0;
}

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

function average(arr) {
    return arr.length ? sum(arr) / arr.length : 0;
}

function displaySummaryStats() {
    if (!selectedTeam) return;
    
    const teamData = scoutingData.filter(d => d.teamNumber == selectedTeam);
    const totalMatches = teamData.length;
    
    const avgCoralAuto = average(teamData.map(d => 
        num(d.AutoCorL1) + num(d.AutoCorL2) + num(d.AutoCorL3) + num(d.AutoCorL4)
    ));
    const avgCoralTele = average(teamData.map(d => 
        num(d.TeleCorL1) + num(d.TeleCorL2) + num(d.TeleCorL3) + num(d.TeleCorL4)
    ));
    const climbRate = (teamData.filter(d => d.endgamePos === 'Sh' || d.endgamePos === 'Os').length / totalMatches * 100).toFixed(1);

    const stats = [
        { label: 'Total Matches', value: totalMatches },
        { label: 'Avg Auto Coral', value: avgCoralAuto.toFixed(1) },
        { label: 'Avg Teleop Coral', value: avgCoralTele.toFixed(1) },
        { label: 'Endgame Success', value: climbRate + '%' }
    ];

    const statsRow = document.getElementById('statsRow');
    statsRow.innerHTML = stats.map(stat => `
        <div class="col-md-3">
            <div class="stat-box">
                <p>${stat.label}</p>
                <h3>${stat.value}</h3>
            </div>
        </div>
    `).join('');
}

function createCharts() {
    if (!selectedTeam) return;
    
    Object.values(charts).forEach(chart => chart?.destroy());

    const teamData = scoutingData.filter(d => d.teamNumber == selectedTeam);
    const matchNumbers = [...new Set(teamData.map(d => num(d.matchNumber)))].sort((a, b) => a - b);
    
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

    const allTeamData = aggregateByTeam();
    const thisTeam = allTeamData[selectedTeam];
    
    const allOffenseRatings = Object.values(allTeamData).map(t => t.avgOffense).sort((a, b) => a - b);
    const allDefenseRatings = Object.values(allTeamData).map(t => t.avgDefense).sort((a, b) => a - b);
    
    const avgStats = {
        avgDefense: getPercentile(thisTeam.avgDefense, allDefenseRatings),
        avgOffense: getPercentile(thisTeam.avgOffense, allOffenseRatings),
        avgTeleopScore: thisTeam.avgTeleCoral,
        avgAutoScore: thisTeam.avgAutoCoral,
        avgEndgame: thisTeam.climbRate
    };

    // TODO: Make replace subjective rankings with DPR and OPR
    charts.radar = new Chart(document.getElementById('radarChart'), {
        type: 'radar',
        data: {
            labels: ['Defense Subjective', 'Offense Subjective', 'Avg Teleop Score', 'Avg Auto Score', 'Endgame %'],
            datasets: [{
                label: 'Team Performance',
                data: [
                    avgStats.avgDefense,
                    avgStats.avgOffense,
                    avgStats.avgTeleopScore,
                    avgStats.avgAutoScore,
                    avgStats.avgEndgame / 10
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
                    suggestedMax: 10,
                    suggestedMin: 0,
                    ticks: {
                        display: false
                    },
                    pointLabels: {
                        font: {
                            size: 14 
                        }
                    },
                    padding: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

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

    const tbody = document.getElementById('penaltyTableBody');
    tbody.innerHTML = penaltyMatches.map(p => `
        <tr>
            <td>${p.match}</td>
            <td>${p.team}</td>
            <td>${p.penalty}</td>
        </tr>
    `).join('');
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