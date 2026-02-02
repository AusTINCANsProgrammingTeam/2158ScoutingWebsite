var chartState;
var uiManager;
var teamSelector;
var columnModal;
var tableRenderer;

document.addEventListener("DOMContentLoaded", async () => {
  chartState = new ChartState();
  uiManager = new UIManager();
  teamSelector = new TeamSelector();
  columnModal = new ColumnSelectorModal();
  tableRenderer = new TeamTableRenderer();
});


class ChartState {
  constructor() {
    this.charts = {};
    this.currentSortColumn = 'avgTotalCoral';
    this.currentSortDirection = 'desc';
    this.selectedColumns = ['avgTotalScore', 'avgAutoScore', 'climbRate', 'avgOffense', 'avgDefense'];
  }

  setSort(column, direction) {
    this.currentSortColumn = column;
    this.currentSortDirection = direction;
  }

  toggleSortDirection() {
    this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
  }

  setSelectedColumns(columns) {
    this.selectedColumns = columns;
  }

  getSelectedColumns() {
    return this.selectedColumns;
  }

  destroyAllCharts() {
    Object.values(this.charts).forEach(chart => chart?.destroy());
    this.charts = {};
  }

  addChart(name, chart) {
    this.charts[name] = chart;
  }
}

class UIManager {
  show(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'block';
  }

  hide(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
  }

  toggle(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
  }

  setInnerHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) element.innerHTML = html;
  }

  getValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : null;
  }

  setValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.value = value;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

function toggleLoader() {
  const card = document.getElementById('loaderCard');
  const btn = card?.querySelector('button');

  if (!card || !btn) return;

  if (card.style.display === 'none') {
    card.style.display = 'block';
    btn.textContent = 'Hide';
  } else {
    card.style.display = 'none';
    btn.textContent = 'Show';
  }
}

class TeamSelector {
  populateSelector(data) {
    const teamNumbers = [...new Set(data.map(d => d.teamNumber))].sort((a, b) => a - b);
    const select = document.getElementById('teamSelect');

    if (!select) return;

    select.innerHTML = '<option value="">-- Select a Team --</option>' +
      teamNumbers.map(team => `<option value="${team}">${team}</option>`).join('');
  }

  updateTeamData() {
    const teamNumber = uiManager.getValue('teamSelect');
    selectedTeam = teamNumber;

    if (!selectedTeam) {
      uiManager.hide('teamDetail');
      uiManager.hide('chartsSection');
      return;
    }

    const detailRenderer = new TeamDetailRenderer();
    detailRenderer.render(selectedTeam);

    const chartManager = new ChartManager();
    chartManager.createAllCharts(selectedTeam);

    uiManager.show('teamDetail');
    uiManager.show('chartsSection');
  }

  selectFromTable(teamNumber) {
    uiManager.setValue('teamSelect', teamNumber);
    this.updateTeamData();
    uiManager.scrollToTop();
  }
}

class ColumnSelectorModal {
  open() {
    const modal = document.getElementById('columnSelectorModal');
    const container = document.getElementById('columnCheckboxes');

    if (!modal || !container) return;

    container.innerHTML = Object.entries(availableColumns).map(([key, config]) => {
      const isChecked = chartState.getSelectedColumns().includes(key);
      return `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${key}" 
                 id="col_${key}" ${isChecked ? 'checked' : ''}>
          <label class="form-check-label" for="col_${key}">
            ${config.label}
          </label>
        </div>
      `;
    }).join('');

    modal.style.display = 'block';
  }

  close() {
    const modal = document.getElementById('columnSelectorModal');
    if (modal) modal.style.display = 'none';
  }

  apply() {
    const checkboxes = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]');
    const selected = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    if (selected.length === 0) {
      alert('Please select at least one column');
      return;
    }

    chartState.setSelectedColumns(selected);
    this.close();
    tableRenderer.render();
  }
}

class TeamTableRenderer {
  sortTable(column) {
    if (chartState.currentSortColumn === column) {
      chartState.toggleSortDirection();
    } else {
      chartState.setSort(column, 'desc');
    }
    this.render();
  }

  render() {
    const sorted = this.getSortedTeams();
    this.renderHeader();
    this.renderBody(sorted);
  }

  getSortedTeams() {
    return Object.entries(teams).sort((a, b) => {
      const aVal = a[1][chartState.currentSortColumn] || 0;
      const bVal = b[1][chartState.currentSortColumn] || 0;

      return chartState.currentSortDirection === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    });
  }

  renderHeader() {
    const getSortIcon = (col) => {
      if (chartState.currentSortColumn !== col) return '↑↓';
      return chartState.currentSortDirection === 'asc' ? '↑' : '↓';
    };

    const headerHTML = `
      <tr>
        <th onclick="tableRenderer.sortTable('rank')" style="cursor: pointer;">
          Rank ${getSortIcon('rank')}
        </th>
        <th onclick="tableRenderer.sortTable('teamNumber')" style="cursor: pointer;">
          Team ${getSortIcon('teamNumber')}
        </th>
        ${chartState.getSelectedColumns().map(col => `
          <th onclick="tableRenderer.sortTable('${col}')" style="cursor: pointer;">
            ${availableColumns[col].label} ${getSortIcon(col)}
          </th>
        `).join('')}
        <th onclick="tableRenderer.sortTable('matches')" style="cursor: pointer;">
          Matches ${getSortIcon('matches')}
        </th>
      </tr>
    `;

    uiManager.setInnerHTML('teamTableHead', headerHTML);
  }

  renderBody(sortedTeams) {
    const bodyHTML = sortedTeams.map(([teamNum, stats], index) => `
      <tr class="team-row" onclick="teamSelector.selectFromTable('${teamNum}')">
        <td>${index + 1}</td>
        <td>${teamNum}</td>
        ${chartState.selectedColumns.map(col => `
          <td>${availableColumns[col].format(stats[col] || 0)}</td>
        `).join('')}
        <td>${stats.matches}</td>
      </tr>
    `).join('');

    uiManager.setInnerHTML('teamTableBody', bodyHTML);
  }
}

class TeamDetailRenderer {
  render(teamNumber) {
    const teamMatches = getTeamMatches(teamNumber);
    const teamStats = teams[teamNumber];

    if (!teamStats) {
      console.error(`No stats found for team ${teamNumber}`);
      return;
    }

    uiManager.setInnerHTML('detailTeamNumber', teamNumber);

    const html = `
      ${this.renderStatBoxes(teamStats)}
      <h4 class="mb-0" style="color: #FFF01F;">Match History</h4>
      ${
        this.renderMatchHistoryTable(teamMatches)
      }
    `;

    uiManager.setInnerHTML('teamDetailBody', html);
    uiManager.show('teamDetail');
    uiManager.scrollToElement('teamDetail');
  }

  renderStatBoxes(stats) {
    return `
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="stat-box">
            <p>Avg Teleop Score</p>
            <h3>${stats.avgTeleopScore.toFixed(1)}</h3>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-box">
            <p>Avg Auto Score</p>
            <h3>${stats.avgAutoScore.toFixed(1)}</h3>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-box">
            <p>Offense Rating</p>
            <h3>${stats.avgOffense.toFixed(1)}</h3>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-box">
            <p>Defense Rating</p>
            <h3>${stats.avgDefense.toFixed(1)}</h3>
          </div>
        </div>
      </div>
    `;
  }

  // TODO: recheck yearly implementation
  // TODO: Consider refactoring to seperate per year classes for each breakdown
  renderMatchHistoryTable(matches) {
    if (year === 2026) {
      return this.renderMatchHistoryTable2026(matches);
    } else {
      return this.renderMatchHistoryTable2025(matches);
    }
  }
  
  renderMatchHistoryTable2025(matches) {
    return `
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
            ${matches.map(m => this.renderMatchRow2025(m)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderMatchHistoryTable2026(matches) {
    return `
      <div class="table-responsive">
        <table class="table table-dark table-sm">
          <thead>
            <tr>
              <th>Match</th>
              <th>Auto Fuel</th>
              <th>Tele Fuel</th>
              <th>Endgame</th>
              <th>Fouls</th>
            </tr>
          </thead>
          <tbody>
            ${matches.map(m => this.renderMatchRow2026(m)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderMatchRow2026(match) {
    return `
      <tr>
        <td>${match.matchNumber}</td>
        <td>${match.AutoFuelScore || 0}</td>
        <td>${match.TeleFuelScore || 0}</td>
        <td>${match.endgamePos || 'N/A'}</td>
        <td>${match.Fouls || 0}</td>
      </tr>
    `;
  }

  renderMatchRow2025(match) {
    const autoCoral = sum([
      num(match.AutoCorL1),
      num(match.AutoCorL2),
      num(match.AutoCorL3),
      num(match.AutoCorL4)
    ]);

    const teleCoral = sum([
      num(match.TeleCorL1),
      num(match.TeleCorL2),
      num(match.TeleCorL3),
      num(match.TeleCorL4)
    ]);

    const algae = sum([
      num(match.AutoAlgProcess),
      num(match.AutoAlgNet),
      num(match.TeleAlgProcess),
      num(match.TeleAlgNet)
    ]);

    return `
      <tr>
        <td>${match.matchNumber}</td>
        <td>${autoCoral}</td>
        <td>${teleCoral}</td>
        <td>${algae}</td>
        <td>${match.endgamePos || 'N/A'}</td>
        <td>${match.Fouls || 0}</td>
      </tr>
    `;
  }
}

class ChartFactory {
  createScoringChart(canvasId, teamData, matchNumbers) {
    const autoScores = year === 2025 
      ? this.calculateAutoScores2025(teamData, matchNumbers)
      : this.calculateAutoScores2026(teamData, matchNumbers);
    
    const teleopScores = year === 2025
      ? this.calculateTeleopScores2025(teamData, matchNumbers)
      : this.calculateTeleopScores2026(teamData, matchNumbers);

    return new Chart(document.getElementById(canvasId), {
      type: 'bar',
      data: {
        labels: matchNumbers.map(m => `Match ${m}`),
        datasets: [
          {
            label: 'Auto',
            data: autoScores,
            backgroundColor: '#FFF01F',
            borderColor: '#FFF01F',
            borderWidth: 1
          },
          {
            label: 'Teleop',
            data: teleopScores,
            backgroundColor: '#0dcaf0',
            borderColor: '#0dcaf0',
            borderWidth: 1
          }
        ]
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

  createScoreByTypeChart(canvasId, teamData, matchNumbers) {
    const datasets = year === 2026 
      ? [{ label: 'Fuel', data: this.calculateLevelScores(teamData, matchNumbers, 'AutoFuelScore'), color: '#FFF01F' }]
      : [
          { label: 'L1', data: this.calculateLevelScores(teamData, matchNumbers, 'TeleCorL1'), color: '#FFF01F' },
          { label: 'L2', data: this.calculateLevelScores(teamData, matchNumbers, 'TeleCorL2'), color: '#0dcaf0' },
          { label: 'L3', data: this.calculateLevelScores(teamData, matchNumbers, 'TeleCorL3'), color: '#198754' },
          { label: 'L4', data: this.calculateLevelScores(teamData, matchNumbers, 'TeleCorL4'), color: '#dc3545' }
        ];

    return new Chart(document.getElementById(canvasId), {
      type: 'bar',
      data: {
        labels: matchNumbers.map(m => `M${m}`),
        datasets: datasets.map(ds => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.color
        }))
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

  createRadarChart(canvasId, teamNumber) {
    const thisTeam = teams[teamNumber];
    const percentiles = this.calculatePercentiles(thisTeam);

    return new Chart(document.getElementById(canvasId), {
      type: 'radar',
      data: {
        labels: ['Defense', 'Offense', 'Teleop Coral', 'Auto Coral', 'Climb Rate'],
        datasets: [{
          label: 'Team Percentile',
          data: percentiles,
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
              font: { size: 14 }
            }
          }
        },
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: (context) => `Percentile: ${context.parsed.r.toFixed(1)}/10`
            }
          }
        }
      }
    });
  }

  calculateAutoScores2025(teamData, matchNumbers) {
    return matchNumbers.map(match => {
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
  }

  calculateAutoScores2026(teamData, matchNumbers) {
    return matchNumbers.map(match => {
      const matchData = teamData.filter(d => num(d.matchNumber) === match);
      return sum(matchData.map(d => num(d.AutoFuelScore)));
    });
  }

  calculateTeleopScores2025(teamData, matchNumbers) {
    return matchNumbers.map(match => {
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
  }

  calculateTeleopScores2026(teamData, matchNumbers) {
    return matchNumbers.map(match => {
      const matchData = teamData.filter(d => num(d.matchNumber) === match);
      return sum(matchData.map(d => num(d.TeleFuelScore)));
    });
  }

  calculateLevelScores(teamData, matchNumbers, field) {
    return matchNumbers.map(match => {
      const matchData = teamData.filter(d => num(d.matchNumber) === match);
      return sum(matchData.map(d => num(d[field])));
    });
  }

  calculatePercentiles(thisTeam) {
    const allStats = {
      defense: Object.values(teams).map(t => t.avgDefense).sort((a, b) => a - b),
      offense: Object.values(teams).map(t => t.avgOffense).sort((a, b) => a - b),
      teleop: Object.values(teams).map(t => t.avgTeleCoral).sort((a, b) => a - b),
      auto: Object.values(teams).map(t => t.avgAutoCoral).sort((a, b) => a - b),
      climb: Object.values(teams).map(t => t.climbRate).sort((a, b) => a - b)
    };

    return [
      getPercentile(thisTeam.avgDefense, allStats.defense),
      getPercentile(thisTeam.avgOffense, allStats.offense),
      getPercentile(thisTeam.avgTeleCoral, allStats.teleop),
      getPercentile(thisTeam.avgAutoCoral, allStats.auto),
      getPercentile(thisTeam.climbRate, allStats.climb)
    ];
  }
}

class ChartManager {
  constructor() {
    this.factory = new ChartFactory();
  }

  createAllCharts(teamNumber) {
    if (!teamNumber) return;

    chartState.destroyAllCharts();

    const teamData = getTeamMatches(teamNumber);
    const matchNumbers = [...new Set(teamData.map(d => num(d.matchNumber)))].sort((a, b) => a - b);

    chartState.addChart('scoring',
      this.factory.createScoringChart('scoringChart', teamData, matchNumbers)
    );

    chartState.addChart('scoreByType',
      this.factory.createScoreByTypeChart('scoreByTypePerRound', teamData, matchNumbers)
    );

    chartState.addChart('radar',
      this.factory.createRadarChart('radarChart', teamNumber)
    );

    this.renderPenaltyTable(teamNumber);
  }

  renderPenaltyTable(teamNumber) {
    const penaltyMatches = teams[teamNumber]?.penaltyMatches || [];
    const tbody = document.getElementById('penaltyTableBody');

    if (!tbody) return;

    if (penaltyMatches.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">No penalties recorded</td></tr>';
      return;
    }

    tbody.innerHTML = penaltyMatches
      .filter(p => p.penalties.length > 0)
      .map(p => `
        <tr>
          <td>${p.match}</td>
          <td>${p.penalties.join(', ')}</td>
        </tr>
      `).join('');
  }
}

function analyzeData() {
  if (scoutingData.length === 0) {
    console.warn('No scouting data available');
    return;
  }

  teamSelector.populateSelector(scoutingData);
  tableRenderer.render();

  uiManager.show('teamSelector');
  uiManager.show('teamTable');
}

function updateTeamData() {
  teamSelector.updateTeamData();
}

function selectTeamFromTable(teamNumber) {
  teamSelector.selectFromTable(teamNumber);
}

function sortTable(column) {
  tableRenderer.sortTable(column);
}

function openColumnSelector() {
  columnModal.open();
}

function closeColumnSelector() {
  columnModal.close();
}

function applyColumnSelection() {
  columnModal.apply();
}

window.onclick = function (event) {
  const modal = document.getElementById('columnSelectorModal');
  if (event.target === modal) {
    closeColumnSelector();
  }
};