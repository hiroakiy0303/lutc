/**
 * LUTC お問い合わせフォーム バックエンド
 *
 * 管理用スプレッドシート「LUTC お問い合わせ管理」にバインドされた
 * コンテナバウンド型 Apps Script。サイトの問い合わせフォームからの
 * POST を受け取り、シートへ行を追記し、自動返信／社内通知メールを送る。
 *
 * デプロイ手順は apps-script/README.md を参照。
 */

// ===== 設定 =====
var CONFIG = {
  // 新着通知の送信先（社内）
  NOTIFY_TO: 'info@lutc.jp',

  // 自動返信・返信メールの差出人に使いたいアドレス。
  // USE_FROM_ALIAS を true にする場合、このアドレスを Gmail の
  // 「他のアドレスとして送信（送信元アドレスの追加）」に登録しておくこと。
  FROM_ADDRESS: 'info@lutc.jp',

  // 差出人の表示名
  FROM_NAME: 'LUTC Consulting',

  // ブランド名（メール本文・署名で使用）
  BRAND: 'LUTC Consulting',

  // true にすると差出人を FROM_ADDRESS（エイリアス）にする。
  // 既定は false（スクリプト所有者のアドレスから送信し、Reply-To に FROM_ADDRESS を設定）。
  // エイリアス登録が済んでから true に変更すること。
  USE_FROM_ALIAS: false,

  // 自動返信（送信者への受付確認メール）を送るか
  SEND_ACK: true,

  // 社内通知（NOTIFY_TO への新着通知メール）を送るか
  SEND_NOTIFY: true
};

// スプレッドシートの列順（ヘッダー）。doPost・返信処理で共有する。
var HEADERS = [
  '受付日時', '受付ID', '会社名', '部署名', '氏名', 'メールアドレス',
  '電話番号', '相談種別', '相談内容', '希望連絡方法', '検討時期',
  '個人情報同意', '対応状況', '返信日時', '担当者', '社内メモ'
];

// 必須項目（フォーム側の name と一致）
var REQUIRED_FIELDS = ['会社名', '氏名', 'メールアドレス', '相談種別', '相談内容'];

/**
 * フォームからの POST を処理する Web アプリのエンドポイント。
 */
function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // ハニーポット: 値が入っていればボットとみなし、成功を装って破棄する。
    if (p._hp) {
      return jsonResponse_({ ok: true });
    }

    // 必須項目の検証
    for (var i = 0; i < REQUIRED_FIELDS.length; i++) {
      var key = REQUIRED_FIELDS[i];
      if (!p[key] || String(p[key]).trim() === '') {
        return jsonResponse_({ ok: false, error: '必須項目が未入力です: ' + key });
      }
    }

    // メールアドレスの簡易検証
    var email = String(p['メールアドレス']).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse_({ ok: false, error: 'メールアドレスの形式が正しくありません。' });
    }

    // 個人情報の取り扱いへの同意（チェックボックス）必須
    if (!p['個人情報の取り扱いへの同意']) {
      return jsonResponse_({ ok: false, error: '個人情報の取り扱いへの同意が必要です。' });
    }

    var sheet = getDataSheet_();
    var now = new Date();
    var receiptId = makeReceiptId_(now);

    var record = {
      '受付日時': now,
      '受付ID': receiptId,
      '会社名': str_(p['会社名']),
      '部署名': str_(p['部署名']),
      '氏名': str_(p['氏名']),
      'メールアドレス': email,
      '電話番号': str_(p['電話番号']),
      '相談種別': str_(p['相談種別']),
      '相談内容': str_(p['相談内容']),
      '希望連絡方法': str_(p['希望連絡方法']),
      '検討時期': str_(p['検討時期']),
      '個人情報同意': p['個人情報の取り扱いへの同意'] ? '同意' : '',
      '対応状況': '未対応',
      '返信日時': '',
      '担当者': '',
      '社内メモ': ''
    };

    appendRecord_(sheet, record);

    // メール送信（失敗してもフォーム受付自体は成功扱いにする）
    try {
      if (CONFIG.SEND_ACK) sendAcknowledgement_(record);
      if (CONFIG.SEND_NOTIFY) sendInternalNotification_(record);
    } catch (mailErr) {
      console.error('メール送信に失敗しました: ' + mailErr);
    }

    return jsonResponse_({ ok: true, id: receiptId });
  } catch (err) {
    console.error(err);
    return jsonResponse_({ ok: false, error: 'サーバーでエラーが発生しました。' });
  }
}

/**
 * 簡易ヘルスチェック。ブラウザで /exec を開くと JSON を返す。
 */
function doGet() {
  return jsonResponse_({ ok: true, service: 'LUTC contact form', status: 'ready' });
}

// ===== シート操作 =====

/**
 * データを記録するシート（先頭シート）を取得し、ヘッダーを保証して返す。
 */
function getDataSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  ensureHeaders_(sheet);
  return sheet;
}

/**
 * 1 行目が想定ヘッダーと一致しなければ書き直す（冪等）。
 */
function ensureHeaders_(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var matches = true;
  for (var i = 0; i < HEADERS.length; i++) {
    if (firstRow[i] !== HEADERS[i]) { matches = false; break; }
  }
  if (!matches) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

/**
 * record（ヘッダー名→値）を 1 行として追記する。
 */
function appendRecord_(sheet, record) {
  var row = HEADERS.map(function (h) {
    return record[h] !== undefined ? record[h] : '';
  });
  sheet.appendRow(row);
}

/**
 * シートの初期整形：ヘッダー・対応状況のドロップダウン・列幅を設定する。
 * スプレッドシートのメニュー「お問い合わせ ▸ シートを初期化」から実行する。
 */
function setupSheet() {
  var sheet = getDataSheet_();
  ensureHeaders_(sheet);

  var statusCol = HEADERS.indexOf('対応状況') + 1;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['未対応', '対応中', '返信済み', '完了'], true)
    .setAllowInvalid(false)
    .build();
  var maxRows = sheet.getMaxRows();
  if (maxRows > 1) {
    sheet.getRange(2, statusCol, maxRows - 1, 1).setDataValidation(rule);
  }

  sheet.autoResizeColumns(1, HEADERS.length);
  SpreadsheetApp.getActiveSpreadsheet().toast('シートを初期化しました。', 'LUTC', 4);
}

// ===== 汎用ユーティリティ =====

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function str_(v) {
  return (v === undefined || v === null) ? '' : String(v).trim();
}

/**
 * 受付ID（例: LUTC-20260622-123456-4821）を生成する。
 */
function makeReceiptId_(date) {
  var tz = Session.getScriptTimeZone() || 'Asia/Tokyo';
  var stamp = Utilities.formatDate(date, tz, 'yyyyMMdd-HHmmss');
  var rand = Math.floor(Math.random() * 9000) + 1000;
  return 'LUTC-' + stamp + '-' + rand;
}
