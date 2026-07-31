/**
 * ============================================================
 * TRUE MEDS - RTO & REATTEMPT PORTAL
 * File      : Auth.gs
 * Purpose   : Authentication Module
 * Version   : 3.0
 * ============================================================
 */

const Auth = (() => {

  /**
   * ============================================================
   * PASSWORD HASH
   * ============================================================
   */

  function hash(password) {

    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utility.safeString(password)
    );

    return bytes
      .map(b => {
        const value = (b < 0 ? b + 256 : b).toString(16);
        return ("0" + value).slice(-2);
      })
      .join("");

  }

  /**
   * ============================================================
   * VERIFY PASSWORD
   * ============================================================
   */

  function verify(password, passwordHash) {

    return hash(password) === passwordHash;

  }

  /**
   * ============================================================
   * SESSION ID
   * ============================================================
   */

  function sessionId() {

    return Utility.uuid();

  }

  /**
   * ============================================================
   * FIND USER
   * ============================================================
   */

  function findUser(username) {

    return Database.users.findByUsername(username);

  }

  /**
   * ============================================================
   * LOGIN
   * ============================================================
   */

function login(username, password) {

  username = Utility.safeString(username);
  password = Utility.safeString(password);


    let result;

    result = Validation.username(username);
    if (!result.success) return result;

    result = Validation.password(password);
    if (!result.success) return result;

    const user = findUser(username);

    if (!user)
      return Utility.error(ERROR.USER_NOT_FOUND);

    const data = user.data;

    if (Utility.safeString(data.STATUS) !== STATUS.ACTIVE)
      return Utility.error(ERROR.ACCOUNT_INACTIVE);

    if (Utility.safeString(data.LOCKED).toUpperCase() === "YES")
      return Utility.error(ERROR.ACCOUNT_LOCKED);

    if (!verify(password, data.PASSWORD)) {

      const attempts =
        Database.users.incrementFailedAttempts(user);

      const maxAttempts =
        Number(Config.get("MAX_FAILED_LOGIN"));

      if (attempts >= maxAttempts) {

        Database.users.lock(user.row);

        return Utility.error(ERROR.ACCOUNT_LOCKED);

      }

      return Utility.error(ERROR.INVALID_PASSWORD);

    }

    Database.users.resetFailedAttempts(user.row);

    const id = sessionId();

    Database.users.saveSession(
      user.row,
      id
    );

    return Utility.success(
      SUCCESS.LOGIN,
      {
        sessionId: id,
        username: data.USERNAME,
        riderName: data.RIDER_NAME,
        employeeId: data.EMPLOYEE_ID,
        zone: data.ZONE,
        warehouse: data.WAREHOUSE,
        lmHub: data.LM_HUB,
        role: data.ROLE,
        access: data.ACCESS_SCOPE,
        email: data.REGISTERED_EMAIL,
        status: data.STATUS
      }
    );

  }

  /**
   * ============================================================
   * LOGOUT
   * ============================================================
   */
    function logout(username) {

    const user = findUser(username);

    if (!user)
      return Utility.error(ERROR.USER_NOT_FOUND);

    Database.users.clearSession(user.row);

    return Utility.success(
      SUCCESS.LOGOUT
    );

  }

  /**
   * ============================================================
   * VALIDATE SESSION
   * ============================================================
   */

  function validateSession(sessionId) {

    sessionId = Utility.safeString(sessionId);

    if (!sessionId)
      return null;

    const user = Database.users.findBySession(sessionId);

    if (!user)
      return null;

    if (
      Utility.safeString(user.data.STATUS) !== STATUS.ACTIVE ||
      Utility.safeString(user.data.LOCKED).toUpperCase() === "YES"
    ) {

      return null;

    }

    return user.data;

  }

  /**
   * ============================================================
   * CHANGE PASSWORD
   * ============================================================
   */

  function changePassword(username, oldPassword, newPassword) {

    const user = findUser(username);

    if (!user)
      return Utility.error(ERROR.USER_NOT_FOUND);

    if (!verify(oldPassword, user.data.PASSWORD))
      return Utility.error(ERROR.INVALID_PASSWORD);

    const result = Validation.password(newPassword);

    if (!result.success)
      return result;

    Database.users.updateCell(
      user.row,
      "PASSWORD",
      hash(newPassword)
    );

    return Utility.success(
      SUCCESS.PASSWORD_CHANGED
    );

  }

  /**
   * ============================================================
   * RESET PASSWORD
   * ============================================================
   */

  function resetPassword(username, newPassword) {

    const user = findUser(username);

    if (!user)
      return Utility.error(ERROR.USER_NOT_FOUND);

    const result = Validation.password(newPassword);

    if (!result.success)
      return result;

    Database.users.updateCell(
      user.row,
      "PASSWORD",
      hash(newPassword)
    );

    Database.users.resetFailedAttempts(user.row);

    Database.users.unlock(user.row);

    Database.users.clearSession(user.row);

    return Utility.success(
      SUCCESS.PASSWORD_RESET
    );

  }

  /**
   * ============================================================
   * UNLOCK USER
   * ============================================================
   */

  function unlockUser(username) {

    const user = findUser(username);

    if (!user)
      return Utility.error(ERROR.USER_NOT_FOUND);

    Database.users.unlock(user.row);

    Database.users.resetFailedAttempts(user.row);

    return Utility.success(
      SUCCESS.USER_UNLOCKED
    );

  }

  /**
   * ============================================================
   * PUBLIC API
   * ============================================================
   */

  return {

    hash,
    verify,

    sessionId,

    findUser,

    login,
    logout,

    validateSession,

    changePassword,
    resetPassword,

    unlockUser

  };

})();

/**
 * ============================================================
 * TEST FUNCTIONS
 * ============================================================
 */

function testAuthHash() {

  Logger.log(
    Auth.hash("12345")
  );

}

function testAuthVerify() {

  Logger.log(
    Auth.verify(
      "12345",
      Auth.hash("12345")
    )
  );

}

function testAuthFindUser() {

  Logger.log(
    Auth.findUser("Karan")
  );

}
/**
 * Hash all plain text passwords in User Master
 * Run ONLY ONCE
 */
function hashAllUserPasswords() {

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("User Master");

  const lastRow = sheet.getLastRow();

  // Password is column B
  const range = sheet.getRange(2, 2, lastRow - 1, 1);
  const values = range.getValues();

  for (let i = 0; i < values.length; i++) {

    const password = String(values[i][0]).trim();

    if (!password) continue;

    // Skip if it already looks like SHA-256
    if (/^[a-f0-9]{64}$/i.test(password)) {
      continue;
    }

    values[i][0] = Auth.hash(password);

  }

  range.setValues(values);

  SpreadsheetApp.flush();

  Logger.log("All passwords hashed successfully.");

}
