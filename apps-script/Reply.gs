/**
 * スプレッドシート上の返信ワークフロー。
 * カスタムメニューから選択行に返信メールを送り、対応状況をスタンプする。
 */

/**
 * スプレッドシートを開いたときにカスタムメニューを追加する。
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('お問い合わせ')
    .addItem('選択行に返信', 'replyToSelectedRow')
    .addItem('選択行を対応済みにする', 'markSelectedReplied')
    .addSeparator()
    .addItem('シートを初期化（ヘッダー・入力規則）', 'setupSheet')
    .addToUi();
}

/**
 * 選択中の行の問い合わせに対する返信ダイアログを開く。
 */
function replyToSelectedRow() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();

  if (row < 2) {
    ui.alert('データ行（2行目以降）を選択してください。1行目はヘッダーです。');
    return;
  }

  var record = readRow_(sheet, row);
  if (!record['メールアドレス']) {
    ui.alert('この行にはメールアドレスがありません。');
    return;
  }

  var template = HtmlService.createTemplateFromFile('ReplyDialog');
  template.row = row;
  template.record = record;
  template.defaultSubject = 'Re: お問い合わせの件（受付ID: ' + record['受付ID'] + '）';
  template.defaultBody = buildReplyTemplate_(record);

  var html = template.evaluate().setWidth(640).setHeight(660);
  ui.showModalDialog(html, '選択行に返信');
}

/**
 * 返信本文の下書きテンプレートを生成する。
 */
function buildReplyTemplate_(record) {
  var name = record['氏名'] || 'ご担当者';
  return [
    name + ' 様',
    '',
    'お世話になっております。' + CONFIG.BRAND + ' です。',
    'このたびはお問い合わせいただき、誠にありがとうございます。',
    '',
    '【お問い合わせ内容】',
    record['相談内容'],
    '',
    '────────────────',
    'ここに返信内容をご記入ください。',
    '────────────────',
    '',
    'ご不明な点がございましたら、本メールにそのままご返信ください。',
    '',
    CONFIG.BRAND,
    'info@lutc.jp'
  ].join('\n');
}

/**
 * ダイアログ（ReplyDialog.html）から呼ばれ、返信メールを送信して行をスタンプする。
 * @return {{ok: boolean}}
 */
function sendReply(row, subject, body) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var rowNum = Number(row);
  var record = readRow_(sheet, rowNum);
  var to = record['メールアドレス'];
  if (!to) throw new Error('メールアドレスがありません。');

  sendMail_(to, subject, body);

  setCell_(sheet, rowNum, '返信日時', new Date());
  setCell_(sheet, rowNum, '担当者', getActiveEmail_());
  setCell_(sheet, rowNum, '対応状況', '返信済み');
  return { ok: true };
}

/**
 * メールは送らず、選択行を「返信済み」にする（電話対応した場合など）。
 */
function markSelectedReplied() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert('データ行（2行目以降）を選択してください。');
    return;
  }
  setCell_(sheet, row, '対応状況', '返信済み');
  setCell_(sheet, row, '担当者', getActiveEmail_());
  if (!getCell_(sheet, row, '返信日時')) setCell_(sheet, row, '返信日時', new Date());
  SpreadsheetApp.getActiveSpreadsheet().toast(row + '行目を返信済みにしました。', 'LUTC', 4);
}

// ===== 行ユーティリティ =====

function readRow_(sheet, row) {
  var values = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var obj = {};
  HEADERS.forEach(function (h, i) { obj[h] = values[i]; });
  return obj;
}

function setCell_(sheet, row, header, value) {
  var col = HEADERS.indexOf(header) + 1;
  if (col > 0) sheet.getRange(Number(row), col).setValue(value);
}

function getCell_(sheet, row, header) {
  var col = HEADERS.indexOf(header) + 1;
  return col > 0 ? sheet.getRange(Number(row), col).getValue() : '';
}

function getActiveEmail_() {
  try {
    return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  } catch (e) {
    return '';
  }
}
