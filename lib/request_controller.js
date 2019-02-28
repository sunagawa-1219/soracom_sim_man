const webClient = require("request");

class RequestController {
  /**
   * 使用するwebClientを設定
   */
  constructor() {
    this.client = webClient;
  }

  /**
   * 環境変数を見てプロキシを設定するか判断
   */
  static makeWebClient() {
    return webClient;
  }

  /**
   * トークンを取得する際に使用する(トークン取得にしか使っていないのでstaticになっている)
   * @param {object} params
   * @param {function} client
   */
  static post(params, client) {
    return new Promise((resolve, reject) => {
      client.post(params, (err, _, body) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(JSON.parse(body));
        }
      });
    });
  }

  /**
   * GETの処理
   * @param {object} params
   */
  get(params) {
    return new Promise((resolve, reject) => {
      this.client.get(params, (err, _, body) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(JSON.parse(body));
        }
      });
    });
  }

  /**
   * ヘッダーを含めたGETリクエストを返す関数
   * @param params
   * @return {Promise<*>}
   */
  getIncludeHeader(params) {
    return new Promise((resolve, reject) => {
      this.client.get(params, (err, response, body) => {
        if (err) {
          return reject(err);
        } else {
          const returnObject = {
            header: response.headers,
            body: JSON.parse(body)
          };
          return resolve(returnObject);
        }
      });
    });
  }
}

module.exports = RequestController;
