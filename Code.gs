/**
 * ============================================================
 * TRUE MEDS - RTO & REATTEMPT PORTAL
 * File      : Code.gs
 * Purpose   : Application Entry Point
 * Version   : 2.0.0
 * ============================================================
 */

/**
 * Web App Entry
 */
function doGet(e) {

  return HtmlService
    .createTemplateFromFile("Index")
    .evaluate()
    .setTitle("RTO & Reattempt Portal")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

}


/**
 * Include HTML Files
 * Used for CSS / JS / Components
 */
function include(filename) {

  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();

}
