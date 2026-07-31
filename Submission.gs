/**
 * ============================================================
 * TRUE MEDS - RTO & REATTEMPT PORTAL
 * File      : Submission.gs
 * Purpose   : Submission Management
 * Version   : 1.0
 * ============================================================
 */

 const Submission = (() => {

  /**
   * ============================================================
   * CREATE SUBMISSION
   * ============================================================
   */

            function create(data) {

          /* ---------- Mandatory Validation ---------- */

          let result;

          result = Validation.orderNumber(
            data.orderNumber
          );

          if (!result.success)
            return result;

          result = Validation.required(
            data.reason,
            "Reason"
          );

          if (!result.success)
            return result;

          /* ---------- Check Reason Configuration ---------- */

          const reasonConfig =
            Database.reasons.findByReason(
              data.reason
            );

          if (reasonConfig) {

            const mandatoryProofRequired =

              reasonConfig.data.MANDATORY_PROOF === true ||

              Utility.safeString(
                reasonConfig.data.MANDATORY_PROOF
              ).toUpperCase() === "TRUE" ||

              Utility.safeString(
                reasonConfig.data.MANDATORY_PROOF
              ).toUpperCase() === "YES";

            if (mandatoryProofRequired) {

              result = Validation.required(

                data.mandatoryProof,

                "Mandatory Proof"

              );

              if (!result.success)
                return result;

            }

          }

    /* ---------- Logged-in User ---------- */

    const user = Database.users.findByUsername(
      data.username
    );

    if (!user)
      return Utility.error(ERROR.USER_NOT_FOUND);

    if (
      Utility.safeString(user.data.STATUS) !== STATUS.ACTIVE
    ) {

      return Utility.error(
        ERROR.ACCOUNT_INACTIVE
      );

    }

    /* ---------- Submission ---------- */

    const submissionId =
      Utility.generateSubmissionId();

    const timestamp =
      Utility.formatDateTime();

    Database.submissions.insert({

      SUBMISSION_ID: submissionId,

      TIMESTAMP: timestamp,

      USERNAME: user.data.USERNAME,

      RIDER_NAME: user.data.RIDER_NAME,

      EMPLOYEE_ID: user.data.EMPLOYEE_ID,

      ZONE: user.data.ZONE,

      WAREHOUSE: user.data.WAREHOUSE,

      LM_HUB: user.data.LM_HUB,

      ORDER_NUMBER: Utility.safeString(
        data.orderNumber
      ).toUpperCase(),

      MANDATORY_PROOF:
        data.mandatoryProof,

      OPTIONAL_PROOF:
        data.optionalProof || "",

      REASON:
        data.reason,

      STATUS:
        SUBMISSION_STATUS.SUBMITTED,

      ASSIGNED_TO: "",

      REVIEWED_BY: "",

      REVIEWED_ON: "",

      LAST_UPDATED: timestamp,

      REVIEW_TIME: ""

    });

    return Utility.success(

      SUCCESS.SUBMISSION_CREATED,

      {

        submissionId: submissionId,

        status: SUBMISSION_STATUS.SUBMITTED

      }

    );

  }

  /**
   * ============================================================
   * GET SUBMISSION
   * ============================================================
   */

  function get(submissionId) {

    return Database.submissions.findBySubmissionId(
      submissionId
    );

  }

  /**
   * ============================================================
   * LIST SUBMISSIONS
   * ============================================================
   */

  function list() {

    return Database.submissions.list();

  }

  /**
   * ============================================================
   * MY SUBMISSIONS
   * ============================================================
   */

  function mySubmissions(username) {

    return Database.submissions.findByUsername(
      username
    );

  }

  /**
   * ============================================================
   * PART 2 CONTINUES...
   * ============================================================
   */
    /**
   * ============================================================
   * ASSIGN SUBMISSION
   * ============================================================
   */

  const REVIEW_LOCK_MINUTES = 30;

  function claimForReview(submissionId, username) {

    const submission =
      Database.submissions.findBySubmissionId(submissionId);

    if (!submission)
      return Utility.error(ERROR.SUBMISSION_NOT_FOUND);

    const status = Utility.safeString(submission.data.STATUS);
    const assignedTo = Utility.safeString(submission.data.ASSIGNED_TO);

    if (status === SUBMISSION_STATUS.APPROVED || status === SUBMISSION_STATUS.REJECTED) {
      return Utility.error("This submission has already been reviewed.");
    }

    if (
      status === SUBMISSION_STATUS.UNDER_REVIEW &&
      assignedTo &&
      assignedTo.toLowerCase() !== Utility.safeString(username).toLowerCase()
    ) {

      const lockedSince = new Date(submission.data.LAST_UPDATED);

      const minutesElapsed = isNaN(lockedSince.getTime())
        ? REVIEW_LOCK_MINUTES + 1
        : Math.floor((Date.now() - lockedSince.getTime()) / 60000);

      if (minutesElapsed < REVIEW_LOCK_MINUTES) {

      return Utility.error(
          "Wait the " + submissionId + " is under review with " +
          assignedTo + ", try after " +
          (REVIEW_LOCK_MINUTES - minutesElapsed) + " minute(s)."
        );

      }

    }

    Database.submissions.updateCell(submission.row, "STATUS", SUBMISSION_STATUS.UNDER_REVIEW);
    Database.submissions.updateCell(submission.row, "ASSIGNED_TO", username);
    Database.submissions.updateCell(submission.row, "LAST_UPDATED", Utility.formatDateTime());

    return Utility.success(SUCCESS.UPDATED);

  }

  function assignSubmission(submissionId, assignedTo) {

    const submission =
      Database.submissions.findBySubmissionId(submissionId);

    if (!submission)
      return Utility.error(ERROR.SUBMISSION_NOT_FOUND);

    Database.submissions.assign(
      submission.row,
      assignedTo
    );

    Database.audit.insert({

      TIMESTAMP: Utility.formatDateTime(),

      SUBMISSION_ID: submissionId,

      ACTION: "Assigned",

      MODULE: "Submission",

      OLD_STATUS: submission.data.STATUS,

      NEW_STATUS: submission.data.STATUS,

      PERFORMED_BY: assignedTo,

      ROLE: "",

      REMARKS: "",

      VERSION: Config.get("APP_VERSION")

    });

    return Utility.success(SUCCESS.UPDATED);

  }

  /**
   * ============================================================
   * UPDATE STATUS
   * ============================================================
   */

  function updateStatus(
    submissionId,
    status,
    reviewedBy,
    remarks
  ) {

    const submission =
      Database.submissions.findBySubmissionId(submissionId);

    if (!submission)
      return Utility.error(ERROR.SUBMISSION_NOT_FOUND);

    Database.submissions.review(

        submission.row,

        reviewedBy,

        status,

        remarks

    );

    Logger.log(submission.data.TIMESTAMP);
    Logger.log(typeof submission.data.TIMESTAMP);

    Database.submissions.updateCell(

      submission.row,

      "REVIEW_TIME",

      calculateReviewTime(
          submission.data.TIMESTAMP
      )

    );

    Database.audit.insert({

      TIMESTAMP: Utility.formatDateTime(),

      SUBMISSION_ID: submissionId,

      ACTION: "Status Updated",

      MODULE: "Submission",

      OLD_STATUS: submission.data.STATUS,

      NEW_STATUS: status,

      PERFORMED_BY: reviewedBy,

      ROLE: "",

      REMARKS: Utility.safeString(remarks),

      VERSION: Config.get("APP_VERSION")

    });

    return Utility.success(SUCCESS.UPDATED);

  }

  /**
   * ============================================================
   * APPROVE
   * ============================================================
   */

  function approveSubmission(
    submissionId,
    reviewedBy
  ) {

    return updateStatus(

      submissionId,

      SUBMISSION_STATUS.APPROVED,

      reviewedBy

    );

  }

  /**
   * ============================================================
   * REJECT
   * ============================================================
   */

  function rejectSubmission(
    submissionId,
    reviewedBy
  ) {

    return updateStatus(

      submissionId,

      SUBMISSION_STATUS.REJECTED,

      reviewedBy

    );

  }

  /**
   * ============================================================
   * REVIEW TIME
   * ============================================================
   */

function calculateReviewTime(createdOn) {

    if (!createdOn) return "";

    const start = new Date(createdOn);

    if (isNaN(start.getTime())) return "";

    const diff = Math.floor((Date.now() - start.getTime()) / 60000);

    return diff + " Minutes";

}

  /**
   * ============================================================
   * DELETE
   * ============================================================
   */

  function deleteSubmission(
    submissionId
  ) {

    const submission =
      Database.submissions.findBySubmissionId(submissionId);

    if (!submission)
      return Utility.error(ERROR.SUBMISSION_NOT_FOUND);

    Database.submissions.remove(
      submission.row
    );

    Database.audit.insert({

      TIMESTAMP: Utility.formatDateTime(),

      SUBMISSION_ID: submissionId,

      ACTION: "Deleted",

      MODULE: "Submission",

      OLD_STATUS: submission.data.STATUS,

      NEW_STATUS: "",

      PERFORMED_BY: "",

      ROLE: "",

      REMARKS: "",

      VERSION: Config.get("APP_VERSION")

    });

    return Utility.success(SUCCESS.UPDATED);

  }

  /**
   * ============================================================
   * SEARCH
   * ============================================================
   */

  function search(orderNumber) {

    return Database.submissions.findByOrderNumber(
      Utility.safeString(orderNumber).toUpperCase()
    );

  }

  /**
   * ============================================================
   * STATISTICS
   * ============================================================
   */

  function statistics() {

    return {

      total:
        Database.submissions.count(),

      pending:
        Database.submissions.countByStatus(
          SUBMISSION_STATUS.PENDING
        ),

      approved:
        Database.submissions.countByStatus(
          SUBMISSION_STATUS.APPROVED
        ),

      rejected:
        Database.submissions.countByStatus(
          SUBMISSION_STATUS.REJECTED
        )

    };

  }

  /**
   * ============================================================
   * PUBLIC API
   * ============================================================
   */

return {

    create,

    get,

    list,

    mySubmissions,

    claimForReview,

    assignSubmission,

    updateStatus,

    approveSubmission,

    rejectSubmission,

    deleteSubmission,

    search,

    statistics,

    calculateReviewTime

  };

})();
