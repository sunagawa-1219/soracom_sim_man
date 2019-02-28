const SoracomController = require("./lib/soracom_controller");
const KintoneController = require("./lib/kintone_controller");
const RequestController = require("./lib/request_controller");
const RecordsController = require("./lib/records_controller");

exports.handler = async (event, context) => {
  try {
    const records = await KintoneController.scanKintoneRecords();
    const webClient = RequestController.makeWebClient();
    const { apiKey, token } = await SoracomController.getToken(webClient);
    const soracomController = new SoracomController(token, apiKey);
    await soracomController.scanSimInfo("subscribers");
    await soracomController.scanGroups();
    const summarizedSimInfo = soracomController.summarizeSimInfo();
    const checkedRecords = RecordsController.makeRecords(
      summarizedSimInfo,
      records
    );
    await KintoneController.changeAllRecords(
      checkedRecords.addRecords,
      checkedRecords.updateRecords,
      checkedRecords.removeRecordIds
    );
    console.log("ALL DONE");
    return "success!";
  } catch (err) {
    console.log("error happen");
    console.error(err);
    return "error";
  }
};
