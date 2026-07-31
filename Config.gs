/**
 * ============================================================
 * TRUE MEDS - RTO & REATTEMPT PORTAL
 * File      : Config.gs
 * Purpose   : Configuration Manager
 * Version   : 2.0.0
 * ============================================================
 */

const Config = (() => {

  const CONFIG_SHEET = "Configuration";
  const LINK_SHEET   = "G-sheet/Drive Links";

  let settingsCache = null;
  let linksCache = null;

  /**
   * Load Configuration Sheet
   */
  function loadSettings() {

    if (settingsCache) return settingsCache;

    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG_SHEET);

    if (!sheet)
      throw new Error("Configuration sheet not found.");

    const values = sheet.getDataRange().getValues();

    settingsCache = {};

    for (let i = 1; i < values.length; i++) {

      const key = String(values[i][0]).trim();

      if (!key) continue;

      settingsCache[key] = values[i][1];

    }

    return settingsCache;

  }

  /**
   * Load Sheet / Drive Links
   */
  function loadLinks() {

    if (linksCache) return linksCache;

    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(LINK_SHEET);

    if (!sheet)
      throw new Error("G-sheet/Drive Links sheet not found.");

    const values = sheet.getDataRange().getValues();

    linksCache = values.slice(1);

    return linksCache;

  }

  /**
   * Public API
   */
  return {

    /**
     * Get Setting Value
     */
    get(key) {

      const settings = loadSettings();

      return settings[key];

    },

    /**
     * Get All Settings
     */
    all() {

      return loadSettings();

    },

    /**
     * Get All Link Rows
     */
    links() {

      return loadLinks();

    },

    /**
     * Reload Configuration
     */
    refresh() {

      settingsCache = null;
      linksCache = null;

    }

  };

})();
