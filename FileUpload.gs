/**
 * ============================================================
 * TRUE MEDS - RTO & REATTEMPT PORTAL
 * File      : FileUpload.gs
 * Purpose   : Google Drive Upload Manager
 * Version   : 1.0
 * ============================================================
 */

const FileUpload = (() => {

  /**
   * ============================================================
   * UPLOAD FILE
   * ============================================================
   */

  function upload(file, folderUrl) {

    if (!file)
      return Utility.error(ERROR.FILE_REQUIRED);

    const validation =
      Validation.fileSize(file.getBytes().length);

    if (!validation.success)
      return validation;

    const mime =
      Validation.mimeType(file.getContentType());

    if (!mime.success)
      return mime;

    const folder =
      getFolder(folderUrl);

    if (!folder)
      return Utility.error(
        ERROR.INVALID_FOLDER
      );

    const uploaded =
      folder.createFile(file);

    return Utility.success(

      SUCCESS.FILE_UPLOADED,

      {

        fileId:
          uploaded.getId(),

        fileName:
          uploaded.getName(),

        fileUrl:
          uploaded.getUrl(),

        mimeType:
          uploaded.getMimeType(),

        size:
          uploaded.getSize()

      }

    );

  }

  /**
   * Converts a browser data URL into an Apps Script Blob before uploading it.
   * The upload folder is read from Configuration -> UPLOAD_FOLDER_URL.
   */
  function uploadBase64(dataUrl, fileName, folderName) {

  Logger.log("================================");
  Logger.log("Folder Name : " + folderName);

  const match =
    Utility.safeString(dataUrl).match(
      /^data:([^;]+);base64,(.+)$/
    );

  if (!match)
    return Utility.error(ERROR.INVALID_FILE_TYPE);

  const contentType = match[1];

  const bytes =
    Utilities.base64Decode(match[2]);

  const blob =
    Utilities.newBlob(
      bytes,
      contentType,
      Utility.safeString(fileName) || "upload"
    );

  const link =
    Database.links.getActive(
      folderName,
      "Live"
    );

  Logger.log("Link Object : " + JSON.stringify(link));

  if (!link)
    return Utility.error(ERROR.INVALID_FOLDER);

  Logger.log("Folder URL : " + link.URL);

  const folder =
    getFolder(link.URL);

  Logger.log("Folder : " + folder);

  if (!folder)
    return Utility.error(ERROR.INVALID_FOLDER);

  const uploaded =
    folder.createFile(blob);

  return Utility.success(
    SUCCESS.FILE_UPLOADED,
    {
      fileId: uploaded.getId(),
      fileName: uploaded.getName(),
      fileUrl: uploaded.getUrl()
    }
  );

}
  /**
   * ============================================================
   * GET DRIVE FOLDER
   * ============================================================
   */

  function getFolder(url) {

  if (!url)
    return null;

  try {

    const folderId =

      Utility.safeString(url)

      .match(/[-\w]{25,}/);

    if (!folderId)
      return null;

    return DriveApp.getFolderById(
      folderId[0]
    );

  }

  catch (error) {

    Logger.log(error);

    return null;

  }

}

  /**
   * ============================================================
   * DELETE FILE
   * ============================================================
   */

  function remove(fileId) {

    try {

      DriveApp
        .getFileById(fileId)
        .setTrashed(true);

      return Utility.success(
        SUCCESS.DELETED
      );

    }

    catch (e) {

      return Utility.error(
        ERROR.FILE_NOT_FOUND
      );

    }

  }

  /**
   * ============================================================
   * PART 2 CONTINUES...
   * ============================================================
   */
    /**
   * ============================================================
   * GET FILE
   * ============================================================
   */

  function getFile(fileId) {

    try {

      return DriveApp.getFileById(fileId);

    }

    catch (e) {

      return null;

    }

  }

  /**
   * ============================================================
   * FILE INFORMATION
   * ============================================================
   */

  function fileInfo(fileId) {

    const file = getFile(fileId);

    if (!file)
      return Utility.error(
        ERROR.FILE_NOT_FOUND
      );

    return Utility.success(

      SUCCESS.FETCHED,

      {

        id:
          file.getId(),

        name:
          file.getName(),

        url:
          file.getUrl(),

        mimeType:
          file.getMimeType(),

        size:
          file.getSize(),

        created:
          file.getDateCreated(),

        updated:
          file.getLastUpdated()

      }

    );

  }

  /**
   * ============================================================
   * DOWNLOAD URL
   * ============================================================
   */

  function downloadUrl(fileId) {

    const file = getFile(fileId);

    if (!file)
      return "";

    return file.getDownloadUrl();

  }

  /**
   * ============================================================
   * COPY FILE
   * ============================================================
   */

  function copyFile(fileId, folderUrl) {

    const file =
      getFile(fileId);

    if (!file)
      return Utility.error(
        ERROR.FILE_NOT_FOUND
      );

    const folder =
      getFolder(folderUrl);

    if (!folder)
      return Utility.error(
        ERROR.INVALID_FOLDER
      );

    const copied =
      file.makeCopy(
        file.getName(),
        folder
      );

    return Utility.success(

      SUCCESS.COPIED,

      {

        fileId:
          copied.getId(),

        fileUrl:
          copied.getUrl()

      }

    );

  }

  /**
   * ============================================================
   * MOVE FILE
   * ============================================================
   */

  function moveFile(fileId, folderUrl) {

    const file =
      getFile(fileId);

    if (!file)
      return Utility.error(
        ERROR.FILE_NOT_FOUND
      );

    const folder =
      getFolder(folderUrl);

    if (!folder)
      return Utility.error(
        ERROR.INVALID_FOLDER
      );

    folder.addFile(file);

    const parents =
      file.getParents();

    while (parents.hasNext()) {

      const parent =
        parents.next();

      if (
        parent.getId() !==
        folder.getId()
      ) {

        parent.removeFile(file);

      }

    }

    return Utility.success(
      SUCCESS.MOVED
    );

  }

  /**
   * ============================================================
   * IS IMAGE
   * ============================================================
   */

  function isImage(file) {

    if (!file)
      return false;

    return Utility.safeString(
      file.getMimeType()
    ).startsWith("image/");

  }

  /**
   * ============================================================
   * PUBLIC API
   * ============================================================
   */

  return {

    upload,

    uploadBase64,

    remove,

    getFile,

    fileInfo,

    downloadUrl,

    copyFile,

    moveFile,

    isImage,

    getFolder

  };

})();
