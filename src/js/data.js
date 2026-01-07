let charts = {};

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

function showTeamDetail(teamNumber) {
    const teamMatches = getTeamMatches(teamNumber);
    const teamStats = aggregateByTeam()[teamNumber];
    
    document.getElementById('detailTeamNumber').textContent = teamNumber;
    
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
}

function renderPenaltyTable() {
    const penaltyMatches = getPenaltyMatches(selectedTeam);
    const tbody = document.getElementById('penaltyTableBody');
    
    tbody.innerHTML = penaltyMatches.map(p => `
        <tr>
            <td>${p.match}</td>
            <td>${p.team}</td>
            <td>${p.penalty}</td>
        </tr>
    `).join('');
}