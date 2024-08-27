import axios from 'axios'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { CONFIG } from '../../config/config'
import { Proxy } from '../../types/common.types'
import { IProxyService } from './proxy.types'

export class ProxyService implements IProxyService {
  async checkProxy(proxy: Proxy): Promise<boolean> {
    try {
      const agent = proxy.protocol.startsWith('socks')
        ? new SocksProxyAgent(`${proxy.protocol}://${proxy.host}:${proxy.port}`)
        : new HttpsProxyAgent(`${proxy.protocol}://${proxy.host}:${proxy.port}`)

      await axios.get('https://www.google.com', {
        httpsAgent: agent,
        timeout: 5000,
      })
      return true
    } catch {
      return false
    }
  }

  async getRandomProxy(): Promise<Proxy | null> {
    const workingProxies = await Promise.all(
      CONFIG.PROXIES.map(async (proxy) =>
        (await this.checkProxy(proxy)) ? proxy : null,
      ),
    )
    const filteredProxies = workingProxies.filter(
      (proxy): proxy is Proxy => proxy !== null,
    )

    if (filteredProxies.length === 0) {
      console.log('No working proxies found!')
      return null
    }

    return filteredProxies[Math.floor(Math.random() * filteredProxies.length)]
  }
}
