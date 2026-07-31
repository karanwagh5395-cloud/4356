/**
 * ============================================================
 * TRUE MEDS - RTO & REATTEMPT PORTAL
 * File      : Repository.gs
 * Purpose   : Repository Search
 * Version   : 1.0
 * ============================================================
 */

const Repository = (() => {

  /**
   * ============================================================
   * ACTIVE REPOSITORIES
   * ============================================================
   */

  function repositories() {

    return Database.links
      .list()
      .filter(function(item){

        return Utility.safeString(
          item.data.STATUS
        ) === STATUS.ACTIVE;

      });

  }

  /**
   * ============================================================
   * OPEN REPOSITORY
   * ============================================================
   */

  function openRepository(url) {

    if (!url)
      return null;

    try {

      return SpreadsheetApp.openByUrl(url);

    } catch (e) {

      return null;

    }

  }

  /**
   * ============================================================
   * SEARCH ORDER NUMBER
   * ============================================================
   */

  function searchOrder(orderNumber) {

    orderNumber = Utility
      .safeString(orderNumber)
      .toUpperCase();

    const repos =
      repositories();

    const results = [];

    repos.forEach(function(repo){

      const ss =
        openRepository(repo.data.URL);

      if (!ss)
        return;

      const sheet =
        ss.getSheetByName("Submissions");

      if (!sheet)
        return;

      if (sheet.getLastRow() < 2)
        return;

      const values =
        sheet
          .getDataRange()
          .getValues();

      const headers =
        values.shift();

      const orderCol =
        headers.indexOf("Order Number");

      if (orderCol < 0)
        return;

      values.forEach(function(row){

        if (

          Utility.safeString(
            row[orderCol]
          ).toUpperCase()

          === orderNumber

        ){

          const obj = {};

          headers.forEach(function(h,i){

            obj[h]=row[i];

          });

          obj.Repository =
            repo.data.SHEET_DRIVE_NAME;

          results.push(obj);

        }

      });

    });

    return results;

  }

  /**
   * ============================================================
   * PART 2 CONTINUES...
   * ============================================================
   */
    /**
   * ============================================================
   * SEARCH BY SUBMISSION ID
   * ============================================================
   */

  function searchSubmission(submissionId) {

    submissionId = Utility
      .safeString(submissionId)
      .toUpperCase();

    const repos = repositories();

    const results = [];

    repos.forEach(function (repo) {

      const ss = openRepository(repo.data.URL);

      if (!ss)
        return;

      const sheet = ss.getSheetByName("Submissions");

      if (!sheet || sheet.getLastRow() < 2)
        return;

      const values = sheet.getDataRange().getValues();

      const headers = values.shift();

      const index = headers.indexOf("Submission ID");

      if (index < 0)
        return;

      values.forEach(function (row) {

        if (
          Utility.safeString(row[index]).toUpperCase() ===
          submissionId
        ) {

          const obj = {};

          headers.forEach(function (h, i) {

            obj[h] = row[i];

          });

          obj.Repository = repo.data.SHEET_DRIVE_NAME;

          results.push(obj);

        }

      });

    });

    return results;

  }

  /**
   * ============================================================
   * SEARCH BY USERNAME
   * ============================================================
   */

  function searchUsername(username) {

    username = Utility
      .safeString(username)
      .toLowerCase();

    const repos = repositories();

    const results = [];

    repos.forEach(function (repo) {

      const ss = openRepository(repo.data.URL);

      if (!ss)
        return;

      const sheet = ss.getSheetByName("Submissions");

      if (!sheet || sheet.getLastRow() < 2)
        return;

      const values = sheet.getDataRange().getValues();

      const headers = values.shift();

      const index = headers.indexOf("Username");

      if (index < 0)
        return;

      values.forEach(function (row) {

        if (
          Utility.safeString(row[index]).toLowerCase() ===
          username
        ) {

          const obj = {};

          headers.forEach(function (h, i) {

            obj[h] = row[i];

          });

          obj.Repository = repo.data.SHEET_DRIVE_NAME;

          results.push(obj);

        }

      });

    });

    return results;

  }

  /**
   * ============================================================
   * SEARCH BY EMPLOYEE ID
   * ============================================================
   */

  function searchEmployee(employeeId) {

    employeeId = Utility.safeString(employeeId);

    const repos = repositories();

    const results = [];

    repos.forEach(function (repo) {

      const ss = openRepository(repo.data.URL);

      if (!ss)
        return;

      const sheet = ss.getSheetByName("Submissions");

      if (!sheet || sheet.getLastRow() < 2)
        return;

      const values = sheet.getDataRange().getValues();

      const headers = values.shift();

      const index = headers.indexOf("Employee ID");

      if (index < 0)
        return;

      values.forEach(function (row) {

        if (
          Utility.safeString(row[index]) === employeeId
        ) {

          const obj = {};

          headers.forEach(function (h, i) {

            obj[h] = row[i];

          });

          obj.Repository = repo.data.SHEET_DRIVE_NAME;

          results.push(obj);

        }

      });

    });

    return results;

  }

  /**
   * ============================================================
   * REPOSITORY STATISTICS
   * ============================================================
   */

  function statistics() {

    return {

      repositories:
        repositories().length,

      enabledSearch:
        Utility.safeString(
          Config.get("REPOSITORY_SEARCH")
        ) === "Yes"

    };

  }

  /**
   * ============================================================
   * PUBLIC API
   * ============================================================
   */

  return {

    repositories,

    searchOrder,

    searchSubmission,

    searchUsername,

    searchEmployee,

    statistics

  };

})();
