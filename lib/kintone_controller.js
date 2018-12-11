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
  static scanKintoneRecords() {
    return new Promise((resolve, reject) => {
      kintoneRecord
        .getRecords(appId)
        .then(res => {
          console.log("[SCAN KINTONE RECORDS] success!!");
          console.log("[SCAN KINTONE RECORDS] ", JSON.stringify(res.records));
          return resolve(res.records);
        })
        .catch(err => {
          console.log("[SCAN KINTONE RECORDS] failed...");
          return reject(err);
        });
    });
  }

  static updateRecords(reords) {
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
