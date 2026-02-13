import HttpBase from "./HttpBase";

export default class TipbotApi extends HttpBase {
  tipUser(to: string, network: string): Promise<any> {
    return this.post("/tipbot/sendTip", { to, network });
  }
}
