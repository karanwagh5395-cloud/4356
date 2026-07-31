/**
 * Browser-facing API.
 * Every function returns { success, message, data } so the JavaScript client
 * can use one consistent response contract.
 */
const API = (() => {

  function recordData(record) {
    return record && record.data ? record.data : (record || {});
  }

  function value(data, names) {
    const source = recordData(data);

    for (let i = 0; i < names.length; i++) {
      if (source[names[i]] !== undefined && source[names[i]] !== null)
        return source[names[i]];
    }

    const keys = Object.keys(source);

    for (let i = 0; i < names.length; i++) {
      const wanted = names[i].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      const match = keys.find(key =>
        key.replace(/[^A-Za-z0-9]/g, "").toUpperCase() === wanted
      );

      if (match)
        return source[match];
    }

    return "";
  }

  function text(data, names) {
    const raw = value(data, names);

    if (raw instanceof Date)
      return Utility.formatDateTime(raw);

    return raw === null || raw === undefined ? "" : String(raw);
  }

  function userDto(user) {
    const data = recordData(user);

    return {
      username: text(data, ["USERNAME", "username"]),
      riderName: text(data, ["RIDER_NAME", "riderName", "NAME"]),
      employeeId: text(data, ["EMPLOYEE_ID", "employeeId"]),
      zone: text(data, ["ZONE", "zone"]),
      warehouse: text(data, ["WAREHOUSE", "warehouse"]),
      lmHub: text(data, ["LM_HUB", "lmHub", "HUB"]),
      role: text(data, ["ROLE", "role"]),
      access: text(data, ["ACCESS_SCOPE", "access"]),
      email: text(data, ["REGISTERED_EMAIL", "email"]),
      status: text(data, ["STATUS", "status"])
    };
  }

  function submissionDto(record) {
    const data = recordData(record);

    return {
      submissionId: text(data, ["SUBMISSION_ID", "Submission ID", "submissionId"]),
      timestamp: text(data, ["TIMESTAMP", "Timestamp", "timestamp"]),
      username: text(data, ["USERNAME", "Username", "username"]),
      riderName: text(data, ["RIDER_NAME", "Rider Name", "riderName"]),
      employeeId: text(data, ["EMPLOYEE_ID", "Employee ID", "employeeId"]),
      zone: text(data, ["ZONE", "Zone", "zone"]),
      warehouse: text(data, ["WAREHOUSE", "Warehouse", "warehouse"]),
      lmHub: text(data, ["LM_HUB", "LM Hub", "lmHub"]),
      orderNumber: text(data, ["ORDER_NUMBER", "Order Number", "orderNumber"]),
      mandatoryProof: text(data, ["MANDATORY_PROOF", "Mandatory Proof", "mandatoryProof"]),
      optionalProof: text(data, ["OPTIONAL_PROOF", "Optional Proof", "optionalProof"]),
      reason: text(data, ["REASON", "Reason", "reason"]),
      status: text(data, ["STATUS", "Status", "status"]) || SUBMISSION_STATUS.PENDING,
      assignedTo: text(data, ["ASSIGNED_TO", "Assigned To", "assignedTo"]),
      reviewedBy: text(data, ["REVIEWED_BY", "Reviewed By", "reviewedBy"]),
      reviewedOn: text(data, ["REVIEWED_ON", "Reviewed On", "reviewedOn"]),
      lastUpdated: text(data, ["LAST_UPDATED", "Last Updated", "lastUpdated"]),
      reviewTime: text(data, ["REVIEW_TIME", "Review Time", "reviewTime"])
    };
  }

  function notificationDto(record) {
    const data = recordData(record);
    const readStatus = text(data, ["READ_STATUS", "Read Status", "readStatus"]);

    return {
      id: text(data, ["NOTIFICATION_ID", "Notification ID", "id"]),
      title: text(data, ["TITLE", "Title", "title"]),
      message: text(data, ["MESSAGE", "Message", "message"]),
      type: text(data, ["TYPE", "Type", "type"]),
      date: text(data, ["CREATED_ON", "Created On", "date"]),
      read: readStatus.toUpperCase() === "YES"
    };
  }

      function summary(records, field) {
        const groups = {};

        records.forEach(record => {
          const data = recordData(record);
          const name = text(data, [field]) || "Unspecified";
          const status = text(data, ["STATUS"]);

          if (!groups[name]) {
            groups[name] = {
              name: name,
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0
            };
          }

          groups[name].total++;

          switch (status) {

            case SUBMISSION_STATUS.SUBMITTED:
            case SUBMISSION_STATUS.PENDING:
            case SUBMISSION_STATUS.UNDER_REVIEW:
            case SUBMISSION_STATUS.REOPENED:
              groups[name].pending++;
              break;

            case SUBMISSION_STATUS.APPROVED:
            case SUBMISSION_STATUS.ARCHIVED:
              groups[name].approved++;
              break;

            case SUBMISSION_STATUS.REJECTED:
              groups[name].rejected++;
              break;
          }

        });

        return Object.values(groups).sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
      }

  function login(username, password) {
    return Auth.login(username, password);
  }

  function logout(username) {
    return Auth.logout(username);
  }

  function validateSession(sessionId) {
    const user = Auth.validateSession(sessionId);

    if (!user)
      return Utility.error(ERROR.INVALID_SESSION);

    return Utility.success(SUCCESS.FETCHED, {
      sessionId: sessionId,
      user: userDto(user)
    });
  }

  function changePassword(username, oldPassword, newPassword) {
    return Auth.changePassword(username, oldPassword, newPassword);
  }

  function createSubmission(data) {
    return Submission.create(data || {});
  }

  function mySubmissions(username) {
    return Utility.success(
      SUCCESS.FETCHED,
      Submission.mySubmissions(username).map(submissionDto)
    );
  }

  function getSubmission(id) {
    const record = Submission.get(id);

    if (!record)
      return Utility.error(ERROR.SUBMISSION_NOT_FOUND);

    return Utility.success(SUCCESS.FETCHED, submissionDto(record));
  }

  /**
 * ============================================================
 * DASHBOARD COUNTS
 * ============================================================
 */

function dashboardCounts(username) {

  const data = username
    ? Dashboard.userDashboard(username)
    : Dashboard.counts();

  return Utility.success(
    SUCCESS.FETCHED,
    {

      /* Existing fields (Backward Compatible) */

      total: data.total || 0,
      pending: data.pending || 0,
      approved: data.approved || 0,
      rejected: data.rejected || 0,

      /* New Rider Dashboard fields */

      underReview: data.underReview || 0,
      legitimacy: data.legitimacy || 0

    }
  );

}

function pendingRequests(username) {

    const user = username
      ? Database.users.findByUsername(username)
      : null;

    const records = user
      ? Database.submissions.pendingByScope(user.data)
      : Database.submissions.pending();

    return Utility.success(
      SUCCESS.FETCHED,
      records.map(submissionDto)
    );
  }

  function claimReview(submissionId, username) {
    return Submission.claimForReview(submissionId, username);
  }

  function updateStatus(submissionId, status, reviewedBy, remarks) {
    const allowed = [SUBMISSION_STATUS.APPROVED, SUBMISSION_STATUS.REJECTED];

    if (allowed.indexOf(status) === -1)
      return Utility.error("Invalid submission status.");

    return Submission.updateStatus(
      submissionId,
      status,
      reviewedBy,
      remarks
    );
  }

        function getReasons(role) {

          const records = role
              ? Database.reasons.byRole(role)
              : Database.reasons.active();

          const reasons = records
              .map(record => ({

                  reason: record.data.REASON,

                  mandatoryProof:
                      String(record.data.MANDATORY_PROOF).toUpperCase() === "YES",

                  optionalProof:
                      String(record.data.OPTIONAL_PROOF).toUpperCase() === "YES"

              }))
              .filter(item => item.reason);

          return Utility.success(SUCCESS.FETCHED, reasons);

        }

function adminDashboard(username) {

    const user = username
      ? Database.users.findByUsername(username)
      : null;

    const records = user
      ? Database.submissions.byScope(user.data)
      : Submission.list();

    const pendingCount = records.filter(r =>
      Utility.safeString(r.data.STATUS).toUpperCase() ===
      Utility.safeString(SUBMISSION_STATUS.SUBMITTED).toUpperCase()
    ).length;

    const approvedCount = records.filter(r =>
      r.data.STATUS === SUBMISSION_STATUS.APPROVED
    ).length;

    const rejectedCount = records.filter(r =>
      r.data.STATUS === SUBMISSION_STATUS.REJECTED
    ).length;

    const recentActivity = records
      .slice()
      .sort((a, b) => {
        return new Date(text(b, ["TIMESTAMP"])) - new Date(text(a, ["TIMESTAMP"]));
      })
      .slice(0, 10)
      .map(submissionDto);

    return Utility.success(SUCCESS.FETCHED, {
      total: records.length,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      zoneWise: summary(records, "ZONE"),
      warehouseWise: summary(records, "WAREHOUSE"),
      hubWise: summary(records, "LM_HUB"),
      recentActivity: recentActivity
    });
  }

  function notifications(username) {
    return Utility.success(
      SUCCESS.FETCHED,
      Notification.userNotifications(username).map(notificationDto)
    );
  }

  function unreadNotifications(username) {
    return Utility.success(
      SUCCESS.FETCHED,
      Notification.unread(username).map(notificationDto)
    );
  }

  function unreadNotificationCount(username) {
    return Utility.success(SUCCESS.FETCHED, Notification.unreadCount(username));
  }

  function markNotificationRead(notificationId) {
    return Notification.markRead(notificationId);
  }

  function markAllNotificationsRead(username) {
    return Notification.markAllRead(username);
  }

  function repositorySearch(type, searchValue) {
    let records;

    switch (type) {
      case "order":
        records = Repository.searchOrder(searchValue);
        break;
      case "employee":
        records = Repository.searchEmployee(searchValue);
        break;
      case "username":
        records = Repository.searchUsername(searchValue);
        break;
      case "submission":
      default:
        records = Repository.searchSubmission(searchValue);
        break;
    }

    return Utility.success(SUCCESS.FETCHED, records.map(submissionDto));
  }

  function searchOrder(orderNumber) {
    return Utility.success(SUCCESS.FETCHED, Repository.searchOrder(orderNumber).map(submissionDto));
  }

  function searchSubmission(submissionId) {
    return Utility.success(SUCCESS.FETCHED, Repository.searchSubmission(submissionId).map(submissionDto));
  }

  function searchEmployee(employeeId) {
    return Utility.success(SUCCESS.FETCHED, Repository.searchEmployee(employeeId).map(submissionDto));
  }

  function searchUsername(username) {
    return Utility.success(SUCCESS.FETCHED, Repository.searchUsername(username).map(submissionDto));
  }

  function uploadFile(dataUrl, fileName, folderName) {

  return FileUpload.uploadBase64(

    dataUrl,

    fileName,

    folderName

  );

}

  function fileInformation(fileId) {
    return FileUpload.fileInfo(fileId);
  }

  function deleteFile(fileId) {
    return FileUpload.remove(fileId);
  }

  function configuration() {
    return Utility.success(SUCCESS.FETCHED, Config.all());
  }

  function appInfo() {
    return Utility.success(SUCCESS.FETCHED, {
      name: Config.get("APP_NAME"),
      version: Config.get("APP_VERSION"),
      build: Config.get("BUILD_NUMBER"),
      company: Config.get("COMPANY_NAME"),
      maintenance: Config.get("MAINTENANCE_MODE"),
      forceUpdate: Config.get("FORCE_UPDATE")
    });
  }

  return {
    login,
    logout,
    validateSession,
    changePassword,
    createSubmission,
    mySubmissions,
    getSubmission,
    dashboardCounts,
    pendingRequests,
    updateStatus,
    claimReview,
    getReasons,
    adminDashboard,
    notifications,
    unreadNotifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    repositorySearch,
    searchOrder,
    searchSubmission,
    searchEmployee,
    searchUsername,
    uploadFile,
    fileInformation,
    deleteFile,
    configuration,
    appInfo
  };
})();

/* Google Apps Script functions that can be called from google.script.run. */
function login(username, password) { return API.login(username, password); }
function logout(username) { return API.logout(username); }
function validateSession(sessionId) { return API.validateSession(sessionId); }
function changePassword(username, oldPassword, newPassword) {
  return API.changePassword(username, oldPassword, newPassword);
}
function createSubmission(data) { return API.createSubmission(data); }
function mySubmissions(username) { return API.mySubmissions(username); }
function getSubmission(id) { return API.getSubmission(id); }
function dashboardCounts(username) { return API.dashboardCounts(username); }
function pendingRequests(username) { return API.pendingRequests(username); }
function updateStatus(submissionId, status, reviewedBy, remarks) {
  return API.updateStatus(submissionId, status, reviewedBy, remarks);
}
function claimReview(submissionId, username) {
  return API.claimReview(submissionId, username);
}
function getReasons(role) { return API.getReasons(role); }
function adminDashboard(username) { return API.adminDashboard(username); }
function notifications(username) { return API.notifications(username); }
function unreadNotificationCount(username) { return API.unreadNotificationCount(username); }
function markNotificationRead(id) { return API.markNotificationRead(id); }
function markAllNotificationsRead(username) { return API.markAllNotificationsRead(username); }
function repositorySearch(type, value) { return API.repositorySearch(type, value); }
function searchOrder(orderNo) { return API.searchOrder(orderNo); }
function searchSubmission(id) { return API.searchSubmission(id); }
function searchEmployee(empId) { return API.searchEmployee(empId); }
function searchUsername(username) { return API.searchUsername(username); }
function uploadFile(dataUrl, fileName, folderName) {

  return API.uploadFile(

    dataUrl,

    fileName,

    folderName

  );

}
function fileInformation(fileId) { return API.fileInformation(fileId); }
function deleteFile(fileId) { return API.deleteFile(fileId); }
function configuration() { return API.configuration(); }
function appInfo() { return API.appInfo(); }
