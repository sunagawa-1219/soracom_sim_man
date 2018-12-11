class RecordsController {
  /**
   * 対象データが既にkintoneアプリ内 or SORACOMコンソール内に存在するか確認
   * @param {object} targetData
   * @param {object[]} originRecords
   * @returns {boolean}
   */
  static checkExistData(targetData, originRecords) {
    const filteredData = originRecords.filter(rowData => {
      return rowData.imsi.value === targetData.imsi.value;
    });
    if (filteredData.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * SORACOMコンソールにいなくてkintoneにいるSIM情報を調べる
   * @param {object[]} summarizedData
   * @param {object[]} originRecords
   */
  static checkRemoveData(summarizedData, originRecords) {
    const removeRecordIds = [];
    originRecords.forEach(item => {
      const exist = RecordsController.checkExistData(item, summarizedData);
      if (!exist) {
        removeRecordIds.push(item["レコード番号"].value);
      }
    });
    return removeRecordIds;
  }

  /**
   * 対象データとimsiが同じデータを探す
   * @param {object} targetData
   * @param {object[]} originRecords
   * @returns {object}
   */
  static getOriginTargetdata(targetData, originRecords) {
    const originTargetData = originRecords.filter(item => {
      return item.imsi.value === targetData.imsi.value;
    });
    return originTargetData[0];
  }

  /**
   * 更新が必要なデータか確認する
   * @param {object} targetData
   * @param {object[]} originRecords
   * @returns {boolean}
   */
  static checkNeedToUpdate(targetData, originRecords) {
    let needUpdate = false;
    const targetOriginData = RecordsController.getOriginTargetdata(
      targetData,
      originRecords
    );
    Object.keys(targetData).forEach(keyName => {
      if (
        typeof targetData[keyName].value !== "object" &&
        targetData[keyName].value !== targetOriginData[keyName].value
      ) {
        needUpdate = true;
      } else if (
        typeof targetData[keyName].value === "object" &&
        JSON.stringify(targetData[keyName].value) !==
          JSON.stringify(targetOriginData[keyName].value)
      ) {
        needUpdate = true;
      }
    });
    return {
      needUpdate: needUpdate,
      targetOriginData: targetOriginData
    };
  }

  /**
   * 追加するデータか、更新するデータか、削除するデータに分ける
   * @param {object[]} summarizedData
   * @param {object[]} originRecords
   * @returns {object}
   */
  static makeRecords(summarizedData, originRecords) {
    const updateRecords = [];
    const addRecords = [];
    summarizedData.forEach(item => {
      const exist = RecordsController.checkExistData(item, originRecords);
      if (!exist) {
        addRecords.push(item);
      } else {
        const needUpdate = RecordsController.checkNeedToUpdate(
          item,
          originRecords
        );
        if (needUpdate.needUpdate) {
          updateRecords.push({
            id: needUpdate.targetOriginData["レコード番号"].value,
            record: item
          });
        }
      }
    });
    const removeRecordIds = RecordsController.checkRemoveData(
      summarizedData,
      originRecords
    );
    return {
      addRecords: addRecords,
      updateRecords: updateRecords,
      removeRecordIds: removeRecordIds
    };
  }
}

module.exports = RecordsController;
