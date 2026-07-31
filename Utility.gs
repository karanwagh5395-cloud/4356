/**
 * ============================================================
 * TRUE MEDS - RTO & REATTEMPT PORTAL
 * File      : Utility.gs
 * Purpose   : Common Utility Functions
 * Version   : 2.0
 * ============================================================
 */

const Utility = (() => {

  /**
   * ------------------------------------------------------------
   * SAFE STRING
   * ------------------------------------------------------------
   */

  function safeString(value) {

    return value === null || value === undefined
      ? ""
      : String(value).trim();

  }

  /**
   * ------------------------------------------------------------
   * SUCCESS RESPONSE
   * ------------------------------------------------------------
   */

  function success(message, data) {

    return {

      success: true,

      message: message || "Success.",

      data: data === undefined
        ? null
        : data

    };

  }

  /**
   * ------------------------------------------------------------
   * ERROR RESPONSE
   * ------------------------------------------------------------
   */

  function error(message, data) {

    return {

      success: false,

      message: message || ERROR.UNKNOWN,

      data: data === undefined
        ? null
        : data

    };

  }

  /**
   * ------------------------------------------------------------
   * UUID
   * ------------------------------------------------------------
   */

  function uuid() {

    return Utilities.getUuid();

  }

  /**
   * ------------------------------------------------------------
   * UNIVERSAL DATE & TIME
   * Format : DD/MM/YYYY HH:MM:SS
   * ------------------------------------------------------------
   */

  function formatDateTime(date) {

    const value =
      date instanceof Date
        ? date
        : new Date();

    return Utilities.formatDate(

      value,

      Session.getScriptTimeZone(),

      "dd/MM/yyyy HH:mm:ss"

    );

  }

  /**
   * ------------------------------------------------------------
   * DATE ONLY
   * Format : DD/MM/YYYY
   * ------------------------------------------------------------
   */

  function formatDate(date) {

    const value =
      date instanceof Date
        ? date
        : new Date();

    return Utilities.formatDate(

      value,

      Session.getScriptTimeZone(),

      "dd/MM/yyyy"

    );

  }

  /**
   * ------------------------------------------------------------
   * TIME ONLY
   * Format : HH:MM:SS
   * ------------------------------------------------------------
   */

  function formatTime(date) {

    const value =
      date instanceof Date
        ? date
        : new Date();

    return Utilities.formatDate(

      value,

      Session.getScriptTimeZone(),

      "HH:mm:ss"

    );

  }

  /**
   * ------------------------------------------------------------
   * SUBMISSION ID
   * ------------------------------------------------------------
   */

  function generateSubmissionId() {

    return "SUB-" +

      Utilities.formatDate(

        new Date(),

        Session.getScriptTimeZone(),

        "yyyyMMddHHmmss"

      )

      +

      "-"

      +

      uuid()
        .slice(0, 8)
        .toUpperCase();

  }

  /**
   * ------------------------------------------------------------
   * NOTIFICATION ID
   * ------------------------------------------------------------
   */

  function generateNotificationId() {

    return "NOT-" +

      Utilities.formatDate(

        new Date(),

        Session.getScriptTimeZone(),

        "yyyyMMddHHmmss"

      )

      +

      "-"

      +

      uuid()
        .slice(0, 8)
        .toUpperCase();

  }

  return {

    safeString,

    success,

    error,

    uuid,

    formatDate,

    formatTime,

    formatDateTime,

    generateSubmissionId,

    generateNotificationId

  };

})();
