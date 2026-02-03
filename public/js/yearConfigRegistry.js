class YearConfigClass {
  constructor() {
    this.configs = new Map();
  }

  add(year, configClass) {
    this.configs.set(year, configClass);
  }

  get(year) {
    const ConfigClass = this.configs.get(year);
    if (!ConfigClass) {
      throw new Error(`No configuration found for year ${year}`);
    }
    return new ConfigClass();
  }

  hasConfig(year) {
    return this.configs.has(year);
  }

  getAvailableYears() {
    return Array.from(this.configs.keys());
  }
}

const yearConfigRegistry = new YearConfigClass();

yearConfigRegistry.add(2025, YearConfig2025);
yearConfigRegistry.add(2026, YearConfig2026);
