import * as fs from 'fs'
import * as path from 'path'
import axios, { AxiosResponse } from 'axios'
import { URL } from 'url'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { DownloadedFile } from '../../types/common.types'
import { IProxyService } from '../proxy/proxy.types'
import { IUserAgentService } from '../userAgent/userAgent.types'
import { IDownloaderService } from './downloader.service'

export class DownloaderService implements IDownloaderService {
  constructor(
    private proxyService: IProxyService,
    private userAgentService: IUserAgentService,
  ) {}

  async downloadFile(
    url: string,
    fileType: string,
    downloadFolder: string,
  ): Promise<DownloadedFile | null> {
    const headers = { 'User-Agent': this.userAgentService.getRandomUserAgent() }
    const proxy = await this.proxyService.getRandomProxy()
    try {
      const agent = proxy?.protocol.startsWith('socks')
        ? new SocksProxyAgent(`${proxy.protocol}://${proxy.host}:${proxy.port}`)
        : proxy
        ? new HttpsProxyAgent(`${proxy.protocol}://${proxy.host}:${proxy.port}`)
        : undefined

      const response: AxiosResponse<NodeJS.ReadableStream> = await axios.get(
        url,
        {
          headers,
          httpsAgent: agent,
          responseType: 'stream',
        },
      )

      const contentType = response.headers['content-type'].toLowerCase()
      if (!contentType.includes(fileType)) {
        console.log(`Skipping ${url} - not a ${fileType} file`)
        return null
      }

      const parsedUrl = new URL(url)
      let fileName = decodeURIComponent(path.basename(parsedUrl.pathname))
      if (!fileName.toLowerCase().endsWith(`.${fileType}`)) {
        fileName = `downloaded_file_${
          Math.floor(Math.random() * 9000) + 1000
        }.${fileType}`
      }

      const filePath = path.join(downloadFolder, fileName)
      const writer = fs.createWriteStream(filePath)

      response.data.pipe(writer)

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })
      console.log(`Downloaded: ${filePath}`)
      return { path: filePath, url: url }
    } catch (e) {
      console.error(`Error downloading ${url}: ${e}`)
      return null
    }
  }
}
