const authKeyId = process.env.SORACOM_AUTH_KEY;
const secret = process.env.SORACOM_SECRET_KEY;
const baseUrl = "https://api.soracom.io/v1/";
const requestController = require("./request_controller");

class SoracomController {
  /**
   * トークンなどの初期設定
   * @param {string} token
   * @param {string} apiKey
   */
  constructor(token, apiKey) {
    this.token = token;
    this.apiKey = apiKey;
    this.getHeaders = {
      Accept: "application/json",
      "X-Soracom-Api-Key": this.apiKey,
      "X-Soracom-Token": this.token
    };
    this.request = new requestController();
    this.simInfo = [];
    this.simGroups = [];
  }

  /**
   * SORACOM APIを使用するために必要な情報を取得する
   * @param {function} webClient
   */
  static getToken(webClient) {
    return new Promise(async (resolve, reject) => {
      try {
        const headers = {
          "Content-Type": "application/json"
        };
        const data = {
          authKeyId: authKeyId,
          authKey: secret
        };
        const params = {
          url: baseUrl + "auth",
          headers: headers,
          body: JSON.stringify(data)
        };
        const res = await requestController.post(params, webClient);
        return resolve({
          apiKey: res.apiKey,
          token: res.token
        });
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * APIに対してGETするときに使う
   * @param {string} url
   */
  getRequest(url) {
    const params = {
      url: baseUrl + url,
      headers: this.getHeaders
    };
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.request.getIncludeHeader(params);
        return resolve(res);
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * SIM情報一覧を取得する
   * SORACOM APIの制約により、100個以上のSIM情報を取得できないため、
   * 再帰処理を行っている
   *
   * @param { string } requestUrl
   * @return {Promise<*>}
   */
  async scanSimInfo(requestUrl) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.getRequest(requestUrl);
        console.log(`[SCAN SIM INFO] ${JSON.stringify(res.body)}`);
        this.simInfo.push(...res.body);

        if (res.header["link"]) {
          // if: レスポンスヘッダーにlinkがある場合

          // レスポンスのヘッダの中にある「last_evaluated_key=」と「rel=」の部分を抜き出す
          const regexp = /<.*last_evaluated_key=(\d+)>; rel=(.+)$/g;
          const linkArray = regexp.exec(res.header["link"]);
          // 取得した最後のSIM番号
          const lastEvaluatedKey = linkArray[1];
          // 続きがあるかどうか
          const relationStatus = linkArray[2];

          if (relationStatus === "next") {
            // if: SIM情報に残りがある場合

            await this.scanSimInfo(
              requestUrl + "?last_evaluated_key=" + lastEvaluatedKey
            );
          } else if (relationStatus === "prev") {
            return resolve();
          } else {
            return reject("[ERROR] ヘッダーのlinkのrelの値が想定と異なります");
          }
        }
        return resolve();
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * SIMグループ一覧を取得する
   */
  scanGroups() {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.getRequest("groups");
        this.simGroups = res.body;
        return resolve();
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * 対象SIMが所属しているグループの情報を取得
   * @param {object} simInfo
   */
  filterGroup(simInfo) {
    const targetGroup = this.simGroups.filter(group => {
      return simInfo.groupId === group.groupId;
    });
    return targetGroup[0];
  }

  /**
   * それぞれのサービスが設定されているか確認
   * @param {boolean} enabled
   */
  setEnableStatus(enabled) {
    switch (enabled) {
      case true:
        return "on";
      default:
        return "off";
    }
  }

  /**
   * SORACOM Beamの状態を取得する
   * @param {object} beamInfo
   * @param {object} serviceStatusList
   */
  setBeamStatus(beamInfo, serviceStatusList) {
    const enabeledList = [];
    const sharedKeyList = [];
    Object.keys(beamInfo).forEach((entryPoint, index) => {
      enabeledList.push(beamInfo[entryPoint].enabled);
      switch (typeof beamInfo[entryPoint].clientCerts) {
        case "undefined":
          break;
        default:
          sharedKeyList.push(
            beamInfo[entryPoint].clientCerts.default["$credentialsId"]
          );
          break;
      }
    });
    if (enabeledList.indexOf(true) >= 0) {
      serviceStatusList.beam_radio.value = "on";
    }
    serviceStatusList.shared_key.value = sharedKeyList.join(", ");
  }

  /**
   * SORACOM Air for Cellularの設定情報の取得
   * @param {object} serviceInfo
   */
  getAirSettings(serviceInfo) {
    const checkedItem = Object.keys(serviceInfo).filter(item => {
      return (
        (typeof serviceInfo[item] === "boolean" &&
          serviceInfo[item] === true) ||
        (item === "metadata" && serviceInfo[item].enabled === true)
      );
    });
    return checkedItem.map(item => {
      switch (item) {
        case "authenticationRequired":
          return "CHAP認証設定";
        case "binaryParserEnabled":
          return "バイナリパーサー";
        case "metadata":
          return "メタデータサービス設定";
        case "useCustomDns":
          return "カスタムDNS";
        case "useVpg":
          return "VPG";
        default:
          return "";
      }
    });
  }

  /**
   * 対象グループの設定情報を取得する
   * @param {object} targetGroup
   */
  checkServicesGroupHas(targetGroup) {
    const serviceStatusList = {
      endorse_radio: { value: "off" },
      beam_radio: { value: "off" },
      funnel_radio: { value: "off" },
      harvest_radio: { value: "off" },
      krypton_radio: { value: "off" },
      auth_name: { value: "" },
      shared_key: { value: "" },
      air_check: { value: [] }
    };
    const configurations =
      typeof targetGroup == "undefined" ? {} : targetGroup.configuration;
    Object.keys(configurations).forEach(serviceName => {
      switch (serviceName) {
        case "SoracomHarvest":
          serviceStatusList.harvest_radio.value = this.setEnableStatus(
            configurations[serviceName].enabled
          );
          break;
        case "SoracomFunnel":
          serviceStatusList.funnel_radio.value = this.setEnableStatus(
            configurations[serviceName].enabled
          );
          serviceStatusList.auth_name.value =
            configurations[serviceName].credentialsId;
          break;
        case "SoracomBeam":
          this.setBeamStatus(configurations[serviceName], serviceStatusList);
          break;
        case "SoracomAir":
          serviceStatusList.air_check.value = this.getAirSettings(
            configurations[serviceName]
          );
          break;
        case "SoracomKrypton":
          serviceStatusList.krypton_radio = this.setEnableStatus(
            configurations[serviceName]
          );
          break;
        case "UnifiedEndpoint":
          serviceStatusList.unified_setting = {
            value: configurations[serviceName].response.format
          };
          break;
        default:
          console.log("想定外のキー名です：", serviceName);
          break;
      }
    });
    return serviceStatusList;
  }

  putServicesStatus(rowInfo, serviceList) {
    Object.keys(serviceList).forEach(keyName => {
      if (serviceList[keyName] !== "") {
        rowInfo[keyName] = serviceList[keyName];
      }
    });
  }

  /**
   * SIM情報のサマライズをする
   */
  summarizeSimInfo() {
    const summarizedSimInfo = [];
    this.simInfo.forEach(info => {
      const targetGroup = this.filterGroup(info);
      const rowInfo = {
        imsi: { value: info.imsi },
        sim_name: { value: info.tags.name },
        status: { value: info.status },
        group_name: {
          value: typeof targetGroup == "undefined" ? "" : targetGroup.tags.name
        }
      };
      const serviceList = this.checkServicesGroupHas(targetGroup);
      this.putServicesStatus(rowInfo, serviceList);
      summarizedSimInfo.push(rowInfo);
    });
    return summarizedSimInfo;
  }
}

module.exports = SoracomController;
