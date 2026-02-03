class YearConfig2025 extends YearConfigBase {
  constructor() {
    super(2025);

    // Game piece values
    this.scoring = {
      auto: {
        coral: {
          L1: 3,
          L2: 4,
          L3: 6,
          L4: 7
        },
        algae: {
          processor: 6,
          net: 4
        }
      },
      teleop: {
        coral: {
          L1: 2,
          L2: 3,
          L3: 4,
          L4: 5
        },
        algae: {
          processor: 6,
          net: 4
        }
      }
    };

    // Config Code names
    this.fields = {
      auto: {
        coral: ['AutoCorL1', 'AutoCorL2', 'AutoCorL3', 'AutoCorL4'],
        algae: ['AutoAlgProcess', 'AutoAlgNet']
      },
      teleop: {
        coral: ['TeleCorL1', 'TeleCorL2', 'TeleCorL3', 'TeleCorL4'],
        algae: ['TeleAlgProcess', 'TeleAlgNet']
      }
    };

    // Climb Config Codes
    this.climbPositions = ['Sh', 'Os'];
  }

  getColumns() {
    return {
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
  }

  updateTeamStats(teamNum, match, teams, utils) {
    const { num, sum } = utils;

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

    const teamStats = teams[teamNum];
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
      num(match.TeleCorL1) * this.scoring.teleop.coral.L1,
      num(match.TeleCorL2) * this.scoring.teleop.coral.L2,
      num(match.TeleCorL3) * this.scoring.teleop.coral.L3,
      num(match.TeleCorL4) * this.scoring.teleop.coral.L4,
      num(match.TeleAlgProcess) * this.scoring.teleop.algae.processor,
      num(match.TeleAlgNet) * this.scoring.teleop.algae.net
    ]);

    teamStats.totalAutoScore += sum([
      num(match.AutoCorL1) * this.scoring.auto.coral.L1,
      num(match.AutoCorL2) * this.scoring.auto.coral.L2,
      num(match.AutoCorL3) * this.scoring.auto.coral.L3,
      num(match.AutoCorL4) * this.scoring.auto.coral.L4,
      num(match.AutoAlgProcess) * this.scoring.auto.algae.processor,
      num(match.AutoAlgNet) * this.scoring.auto.algae.net
    ]);

    // Endgame
    teamStats.climbs += this.climbPositions.includes(match.endgamePos) ? 1 : 0;

    // Skills
    teamStats.totalOffense += num(match.offskillrate);
    teamStats.totalDefense += num(match.defskillrate);

    // Penalties
    this.addPenalties(teamStats, match, utils);
  }

  calculateAverages(teams) {
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

  getStatBoxes(stats) {
    return [
      { label: 'Avg Total Score', value: stats.avgTotalScore?.toFixed(1) || '0.0' },
      { label: 'Avg Coral', value: stats.avgTotalCoral?.toFixed(1) || '0.0' },
      { label: 'Avg Auto Coral', value: stats.avgAutoCoral?.toFixed(1) || '0.0' },
      { label: 'Avg Tele Coral', value: stats.avgTeleCoral?.toFixed(1) || '0.0' },
      { label: 'Avg Algae', value: stats.avgTotalAlgae?.toFixed(1) || '0.0' },
      { label: 'Avg Auto Score', value: stats.avgAutoScore?.toFixed(1) || '0.0' },
      { label: 'Avg Teleop Score', value: stats.avgTeleopScore?.toFixed(1) || '0.0' },
      { label: 'Climb Rate', value: (stats.climbRate?.toFixed(0) || '0') + '%' },
      { label: 'Avg Offense', value: stats.avgOffense?.toFixed(1) || '0.0' },
      { label: 'Avg Defense', value: stats.avgDefense?.toFixed(1) || '0.0' },
      { label: 'Matches Played', value: stats.matches || 0 }
    ];
  }

  getMatchHistoryColumns() {
    return [
      { key: 'matchNumber', label: 'Match' },
      { key: 'AutoCorL1', label: 'Auto L1' },
      { key: 'AutoCorL2', label: 'Auto L2' },
      { key: 'AutoCorL3', label: 'Auto L3' },
      { key: 'AutoCorL4', label: 'Auto L4' },
      { key: 'TeleCorL1', label: 'Tele L1' },
      { key: 'TeleCorL2', label: 'Tele L2' },
      { key: 'TeleCorL3', label: 'Tele L3' },
      { key: 'TeleCorL4', label: 'Tele L4' },
      { key: 'AutoAlgProcess', label: 'Auto Alg P' },
      { key: 'AutoAlgNet', label: 'Auto Alg N' },
      { key: 'TeleAlgProcess', label: 'Tele Alg P' },
      { key: 'TeleAlgNet', label: 'Tele Alg N' },
      { key: 'endgamePos', label: 'Climb' }
    ];
  }

  calculateAutoScore(match, utils) {
    const { num } = utils;
    return num(match.AutoCorL1) * this.scoring.auto.coral.L1 +
      num(match.AutoCorL2) * this.scoring.auto.coral.L2 +
      num(match.AutoCorL3) * this.scoring.auto.coral.L3 +
      num(match.AutoCorL4) * this.scoring.auto.coral.L4 +
      num(match.AutoAlgProcess) * this.scoring.auto.algae.processor +
      num(match.AutoAlgNet) * this.scoring.auto.algae.net;
  }

  calculateTeleopScore(match, utils) {
    const { num } = utils;
    return num(match.TeleCorL1) * this.scoring.teleop.coral.L1 +
      num(match.TeleCorL2) * this.scoring.teleop.coral.L2 +
      num(match.TeleCorL3) * this.scoring.teleop.coral.L3 +
      num(match.TeleCorL4) * this.scoring.teleop.coral.L4 +
      num(match.TeleAlgProcess) * this.scoring.teleop.algae.processor +
      num(match.TeleAlgNet) * this.scoring.teleop.algae.net;
  }

  getScoreByTypeDatasets(teamData, matchNumbers, utils) {
    const { num, sum } = utils;

    return [
      {
        label: 'L1',
        data: matchNumbers.map(match => {
          const matchData = teamData.filter(d => num(d.matchNumber) === match);
          return sum(matchData.map(d => num(d.TeleCorL1)));
        }),
        color: '#FFF01F'
      },
      {
        label: 'L2',
        data: matchNumbers.map(match => {
          const matchData = teamData.filter(d => num(d.matchNumber) === match);
          return sum(matchData.map(d => num(d.TeleCorL2)));
        }),
        color: '#0dcaf0'
      },
      {
        label: 'L3',
        data: matchNumbers.map(match => {
          const matchData = teamData.filter(d => num(d.matchNumber) === match);
          return sum(matchData.map(d => num(d.TeleCorL3)));
        }),
        color: '#198754'
      },
      {
        label: 'L4',
        data: matchNumbers.map(match => {
          const matchData = teamData.filter(d => num(d.matchNumber) === match);
          return sum(matchData.map(d => num(d.TeleCorL4)));
        }),
        color: '#dc3545'
      }
    ];
  }
}
