/**
 * Receives Customer Experience & Feedback form submissions.
 *
 * Paste this into Extensions → Apps Script of the Google Sheet that should
 * collect responses, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). See SETUP.md.
 */

// Only needed if this script was NOT created from the Sheet
// (Extensions → Apps Script). Paste the Sheet's ID here: it is the long part
// of the Sheet URL between /d/ and /edit.
const SPREADSHEET_ID = '';

// Responses are written to this tab (created automatically).
const SHEET_NAME = 'Responses';

// Uploaded images are saved in this Google Drive folder (created automatically).
const UPLOAD_FOLDER_NAME = 'Customer Feedback Uploads';

const HEADERS = [
  'Timestamp',
  'Name',
  'Contact',
  'Campus',
  'Location',
  'What would you like to share?',
  'Product',
  'Concern Area',
  'Feedback / Remarks',
  'Images',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const fields = data.fields || {};

    const product = fields.product === 'Other' && fields.product_other
      ? 'Other: ' + fields.product_other
      : fields.product || '';

    const feedback = fields.concern_feedback
      || fields.experience_feedback
      || fields.service_remarks
      || '';

    const imageLinks = saveImages(data.files || [], fields.name);

    getSheet().appendRow([
      new Date(),
      fields.name || '',
      // Leading apostrophe stops Sheets turning "+91…" into a number/formula.
      fields.contact ? "'" + fields.contact : '',
      fields.campus || '',
      fields.sns_location || fields.tkh_location || '',
      fields.share_type || '',
      product,
      fields.concern_area || '',
      feedback,
      imageLinks.join('\n'),
    ]);

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) });
  }
}

// Lets you open the web app URL in a browser to check it is deployed.
function doGet() {
  return json({ ok: true, message: 'Feedback endpoint is running.' });
}

function getSheet() {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet: set SPREADSHEET_ID at the top of Code.gs.');
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getUploadFolder() {
  const folders = DriveApp.getFoldersByName(UPLOAD_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(UPLOAD_FOLDER_NAME);
}

function saveImages(files, name) {
  if (!files.length) return [];
  const folder = getUploadFolder();
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  return files.map(function (file, i) {
    const bytes = Utilities.base64Decode(file.data);
    const blob = Utilities.newBlob(bytes, file.mimeType, stamp + '-' + (name || 'customer') + '-' + (i + 1) + '-' + file.name);
    return folder.createFile(blob).getUrl();
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
