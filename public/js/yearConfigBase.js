// Interface for configs

class YearConfigBase {
  constructor(year) {
    this.year = year;
  }

  getColumns() {
    throw new Error("getColumns() must be implemented by year config");
  }

  updateTeamStats(teamNum, match, teams, utils) {
    throw new Error("updateTeamStats() must be implemented by year config");
  }

  calculateAverages(teams) {
    throw new Error("calculateAverages() must be implemented by year config");
  }

  getStatBoxes(stats) {
    throw new Error("getStatBoxes() must be implemented by year config");
  }

  getMatchHistoryColumns() {
    throw new Error("getMatchHistoryColumns() must be implemented by year config");
  }

  calculateAutoScore(match, utils) {
    throw new Error("calculateAutoScore() must be implemented by year config");
  }

  calculateTeleopScore(match, utils) {
    throw new Error("calculateTeleopScore() must be implemented by year config");
  }

  getScoreByTypeDatasets(teamData, matchNumbers, utils) {
    throw new Error("getScoreByTypeDatasets() must be implemented by year config");
  }

  // Penalties (Should be the same across years)
  addPenalties(teamStats, match, utils) {
    const penalty = {
      match: match.matchNumber,
      team: match.teamNumber,
      penalties: []
    };

    if (utils.num(match.Fouls) > 0) {
      penalty.penalties.push(`Fouls (${match.Fouls})`);
    }
    if (utils.num(match.majorFoul) > 0) {
      penalty.penalties.push(`Major Fouls (${match.majorFoul})`);
    }
    if (utils.num(match.minorFoul) > 0) {
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
}
