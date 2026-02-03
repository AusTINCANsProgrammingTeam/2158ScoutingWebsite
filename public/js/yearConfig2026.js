class YearConfig2026 extends YearConfigBase {
  constructor() {
    super(2026);

    // Game scoring values
    this.scoring = {
      auto: {
        fuel: 1,
        climb: 15 // Climbing during auto exists
      },
      teleop: {
        fuel: 1
      }
    };

    // The codes from the config
    this.fields = {
      auto: {
        fuel: 'AutoFuelScore',
        climb: 'AutoClimb'
      },
      teleop: {
        fuel: 'TeleFuelScore'
      }
    };
    // Climb codes from config
    this.climbPositions = ['L1', 'L2', 'L3'];
  }

  // MUST CALCULATE EVERYTHING NEEDED FOR STATS HERE
  getColumns() {
    return {
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
  }

  updateTeamStats(teamNum, match, teams, utils) {
    const { num, sum } = utils;

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
    };

    const teamStats = teams[teamNum];
    teamStats.matches++;

    // Fuel
    teamStats.totalAutoFuel += sum([
      num(match.AutoFuelScore)
    ]);

    teamStats.totalTeleFuel += sum([
      num(match.TeleFuelScore)
    ]);

    teamStats.totalTeleopScore += sum([
      num(match.TeleFuelScore) * this.scoring.teleop.fuel
    ]);

    teamStats.totalAutoScore += sum([
      num(match.AutoFuelScore) * this.scoring.auto.fuel,
      num(match.AutoClimb) * this.scoring.auto.climb
    ]);

    // Climb
    teamStats.climbs += this.climbPositions.includes(match.endgamePos) ? 1 : 0;

    teamStats.totalOffense += num(match.offskillrate);
    teamStats.totalDefense += num(match.defskillrate);

    // Penalties
    this.addPenalties(teamStats, match, utils);
  }

  calculateAverages(teams) {
    Object.values(teams).forEach(team => {
      const matches = team.matches || 1;

      team.avgAutoFuel = team.totalAutoFuel / matches;
      team.avgTeleFuel = team.totalTeleFuel / matches;
      team.avgTotalFuel = (team.totalAutoFuel + team.totalTeleFuel) / matches;
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
      { label: 'Avg Total Fuel', value: stats.avgTotalFuel?.toFixed(1) || '0.0' },
      { label: 'Avg Auto Fuel', value: stats.avgAutoFuel?.toFixed(1) || '0.0' },
      { label: 'Avg Tele Fuel', value: stats.avgTeleFuel?.toFixed(1) || '0.0' },
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
      { key: 'AutoFuelScore', label: 'Auto Fuel' },
      { key: 'TeleFuelScore', label: 'Tele Fuel' },
      { key: 'AutoClimb', label: 'Auto Climb' },
      { key: 'endgamePos', label: 'Endgame' }
    ];
  }

  calculateAutoScore(match, utils) {
    const { num } = utils;
    return num(match.AutoFuelScore) * this.scoring.auto.fuel +
      num(match.AutoClimb) * this.scoring.auto.climb;
  }

  calculateTeleopScore(match, utils) {
    const { num } = utils;
    return num(match.TeleFuelScore) * this.scoring.teleop.fuel;
  }

  getScoreByTypeDatasets(teamData, matchNumbers, utils) {
    const { num, sum } = utils;

    return [
      {
        label: 'Fuel',
        data: matchNumbers.map(match => {
          const matchData = teamData.filter(d => num(d.matchNumber) === match);
          return sum(matchData.map(d => num(d.AutoFuelScore)));
        }),
        color: '#FFF01F' // Whatever color you want
      }
    ];
  }
}
