/**
 * メール送信（自動返信・社内通知・返信メールで共有）。
 * GmailApp を使用。CONFIG は Code.gs を参照。
 */

/**
 * 送信者への自動返信（受付確認）メール。
 */
function sendAcknowledgement_(record) {
  var to = record['メールアドレス'];
  if (!to) return;

  var name = record['氏名'] || 'ご担当者';
  var subject = '【' + CONFIG.BRAND + '】お問い合わせを受け付けました（受付ID: ' + record['受付ID'] + '）';
  var body = [
    name + ' 様',
    '',
    'この度は ' + CONFIG.BRAND + ' へお問い合わせいただき、誠にありがとうございます。',
    '以下の内容で受け付けいたしました。担当者より改めてご連絡いたします。',
    '',
    '──────────────────────────',
    '受付ID　　： ' + record['受付ID'],
    '会社名　　： ' + record['会社名'],
    'お名前　　： ' + record['氏名'],
    '相談種別　： ' + record['相談種別'],
    '希望連絡方法： ' + (record['希望連絡方法'] || '―'),
    'ご相談内容：',
    record['相談内容'],
    '──────────────────────────',
    '',
    '※本メールは自動送信です。お心当たりのない場合は破棄してください。',
    '',
    CONFIG.BRAND,
    'info@lutc.jp'
  ].join('\n');

  // 顧客が返信すると問い合わせ窓口（FROM_ADDRESS）に届くようにする。
  sendMail_(to, subject, body, CONFIG.FROM_ADDRESS);
}

/**
 * 社内向けの新着通知メール。
 */
function sendInternalNotification_(record) {
  var subject = '【新規問い合わせ】' + record['会社名'] + ' / ' + record['氏名'] +
    '（' + record['相談種別'] + '）';

  var skip = { '対応状況': 1, '返信日時': 1, '担当者': 1, '社内メモ': 1, '個人情報同意': 1 };
  var lines = HEADERS.filter(function (h) { return !skip[h]; }).map(function (h) {
    var v = record[h];
    if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone() || 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
    return h + '： ' + v;
  });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var body = [
    '新しいお問い合わせが届きました。',
    '',
    lines.join('\n'),
    '',
    '管理シートで対応してください:',
    ss.getUrl()
  ].join('\n');

  // 担当者が直接返信できるよう Reply-To を送信者アドレスにする。
  sendMail_(CONFIG.NOTIFY_TO, subject, body, record['メールアドレス']);
}

/**
 * GmailApp によるメール送信の共通ラッパ。
 *
 * - CONFIG.USE_FROM_ALIAS が true の場合は差出人を CONFIG.FROM_ADDRESS にする
 *   （Gmail のエイリアス登録が前提）。
 * - false の場合はスクリプト所有者のアドレスから送信し、Reply-To を設定する。
 *
 * @param {string} to       宛先
 * @param {string} subject  件名
 * @param {string} body     本文（プレーンテキスト）
 * @param {string} replyTo  返信先（省略可）
 */
function sendMail_(to, subject, body, replyTo) {
  var options = { name: CONFIG.FROM_NAME };

  if (CONFIG.USE_FROM_ALIAS && CONFIG.FROM_ADDRESS) {
    options.from = CONFIG.FROM_ADDRESS;
  }
  if (replyTo) {
    options.replyTo = replyTo;
  } else if (!options.from && CONFIG.FROM_ADDRESS) {
    // 差出人を所有者アドレスにする場合でも、返信は問い合わせ窓口に集約する。
    options.replyTo = CONFIG.FROM_ADDRESS;
  }

  GmailApp.sendEmail(to, subject, body, options);
}
