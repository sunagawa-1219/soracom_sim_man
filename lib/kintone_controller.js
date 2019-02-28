const kintone = require("kintone-nodejs-sdk");
const token = process.env.KINTONE_TOKEN;
const basicUserName = process.env.USER_NAME;
const basicPassword = process.env.PASSWORD;
const kintoneAuth = new kintone.Auth();
kintoneAuth.setBasicAuth(basicUserName, basicPassword);
kintoneAuth.setApiToken(token);
const domain = `${process.env.SUB_DOMAIN}.cybozu.com`;
const kintoneConnection = new kintone.Connection(domain, kintoneAuth);
const kintoneRecord = new kintone.Record(kintoneConnection);
const appId = process.env.APP_ID;

class KintoneController {
  /**
   * kintoneアプリ上のレコード数を取得
   */
  static getTotalRecords() {
    return new Promise((resolve, reject) => {
      kintoneRecord
        .getRecords(appId, "", [], true)
        .then(res => {
          return resolve(Number(res.totalCount));
        })
        .catch(err => {
          return reject(err);
        });
    });
  }
  /**
   * kintoneアプリにスキャンをかける
   * 1度に100件までしか取得できないので
   * 全件が100件超える場合は再帰で取得する
   * @param {object[]} scanRecords
   * @param {string} query
   * @param {number} recordCounts
   */
  static getRecords(scanRecords, query, recordCounts) {
    return new Promise((resolve, reject) => {
      kintoneRecord
        .getRecords(appId, query, [], true)
        .then(res => {
          console.log("[SCAN KINTONE RECORDS] success!!");
          scanRecords = scanRecords.concat(res.records);
          if (scanRecords.length === recordCounts) {
            console.log("[SCAN KINTONE RECORDS] All done!!");
            return resolve(scanRecords);
          } else if (scanRecords.length < recordCounts) {
            const startRecordNum = Number(
              scanRecords[scanRecords.length - 1]["レコード番号"]["value"]
            );
            const query = `レコード番号 < ${startRecordNum}`;
            return resolve(
              KintoneController.getRecords(scanRecords, query, recordCounts)
            );
          } else {
            console.log("SCAN したアプリのレコード多すぎ！！！");
            return resolve(scanRecords);
          }
        })
        .catch(err => {
          if (typeof err === Function) {
            return reject(err.getAll());
          }
          return reject(err);
        });
    });
  }
  /**
   * kintoneアプリ上にあるレコードを全件スキャン
   */
  static scanKintoneRecords() {
    return new Promise(async (resolve, reject) => {
      try {
        const recordCounts = await KintoneController.getTotalRecords();
        console.log("[SCAN RECORDS COUNT] ", recordCounts);
        let scanRecords = [];
        scanRecords = await KintoneController.getRecords(
          scanRecords,
          "",
          recordCounts
        );
        console.log("[SCAN KINTONE RECORDS] ", JSON.stringify(scanRecords));
        console.log("[SCANED KINTONE RECORDS COUNT] ", scanRecords.length);
        return resolve(scanRecords);
      } catch (err) {
        return reject(err);
      }
    });
  }

  static updateRecords(records) {
    return new Promise((resolve, reject) => {
      console.log("[UPDATE RECORDS] ", JSON.stringify(records));
      kintoneRecord
        .updateRecords(appId, records)
        .then(res => {
          console.log("[UPDATE RECORDS] success!!");
          return resolve(res);
        })
        .catch(err => {
          console.log("[UPDATE RECORDS] failed...");
          if (typeof err === Function) {
            return reject(err.getAll());
          }
          return reject(err);
        });
    });
  }

  static addNewRecords(records) {
    return new Promise((resolve, reject) => {
      console.log("[ADD RECORDS] ", JSON.stringify(records));
      kintoneRecord
        .addRecords(appId, records)
        .then(res => {
          console.log("[ADD RECORDS] success!!");
          return resolve(res);
        })
        .catch(err => {
          console.log("[ADD RECOREDS] failed...");
          if (typeof err === Function) {
            return reject(err.getAll());
          }
          return reject(err);
        });
    });
  }

  static removeRecords(recordIds) {
    return new Promise((resolve, reject) => {
      console.log("[DELETE RECORD IDS] ", JSON.stringify(recordIds));
      kintoneRecord
        .deleteRecords(appId, recordIds)
        .then(res => {
          console.log("[DELETE RECORDS] success!!");
          return resolve(res);
        })
        .catch(err => {
          console.log("[DELETE RECORDS] failed...");
          if (typeof err === Function) {
            return reject(err.getAll());
          }
          return reject(err);
        });
    });
  }

  static changeAllRecords(addRecords, updateRecords, removeRecords) {
    return new Promise(async (resolve, reject) => {
      try {
        if (typeof addRecords !== "undefined" && addRecords.length > 0) {
          await KintoneController.addNewRecords(addRecords);
        } else {
          console.log("追加するデータがありません");
        }
        if (typeof updateRecords !== "undefined" && updateRecords.length > 0) {
          await KintoneController.updateRecords(updateRecords);
        } else {
          console.log("更新するデータがありません");
        }
        if (typeof removeRecords !== "undefined" && removeRecords.length > 0) {
          await KintoneController.removeRecords(removeRecords);
        } else {
          console.log("削除するデータがありません");
        }
        console.log("更新、追加、削除処理完了");
        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  }
}

module.exports = KintoneController;
