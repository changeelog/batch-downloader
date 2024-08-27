import { Proxy } from "../../types/common.types";

export interface IProxyService {
  checkProxy(proxy: Proxy): Promise<boolean>;
  getRandomProxy(): Promise<Proxy | null>;
}