import * as fs from 'fs'
import * as readline from 'readline'
import { WebDriver } from 'selenium-webdriver'
import { CONFIG } from './config/config'
import { UserInput, DownloadedFile } from './types/common.types'
import { ProxyService } from './modules/proxy/proxy.service'
import { UserAgentService } from './modules/userAgent/userAgent.service'
import { WebDriverService } from './modules/webDriver/webDriver.service'
import { DownloaderService } from './modules/downloader/downloader.types'

class FileSearchAndDownload {
  private proxyService: ProxyService
  private userAgentService: UserAgentService
  private webDriverService: WebDriverService
  private downloaderService: DownloaderService

  constructor() {
    this.proxyService = new ProxyService()
    this.userAgentService = new UserAgentService()
    this.webDriverService = new WebDriverService(this.userAgentService)
    this.downloaderService = new DownloaderService(
      this.proxyService,
      this.userAgentService,
    )
  }

  async searchAndDownload(
    query: string,
    fileType: string = 'pdf',
    maxResults: number = 10,
  ): Promise<DownloadedFile[]> {
    const downloadFolder = decodeURIComponent(query.replace(/ /g, '_'))
    fs.mkdirSync(downloadFolder, { recursive: true })

    let downloadedFiles: DownloadedFile[] = []
    let attempts = 0

    while (
      downloadedFiles.length < maxResults &&
      attempts < CONFIG.MAX_ATTEMPTS
    ) {
      let driver: WebDriver | null = null
      try {
        const proxy = await this.proxyService.getRandomProxy()
        console.log(
          `Using proxy: ${
            proxy ? `${proxy.protocol}://${proxy.host}:${proxy.port}` : 'none'
          }`,
        )
        driver = await this.webDriverService.setupDriver(proxy || undefined)
        await this.webDriverService.performSearch(driver, query, fileType)
        const links = await this.webDriverService.getFileLinks(
          driver,
          maxResults - downloadedFiles.length,
        )

        console.log(`Found ${links.length} links`)

        const downloadPromises = links.map((link) =>
          this.downloaderService.downloadFile(link, fileType, downloadFolder),
        )
        const downloadedPaths = await Promise.all(downloadPromises)
        downloadedFiles.push(
          ...downloadedPaths.filter(
            (file): file is DownloadedFile => file !== null,
          ),
        )

        if (downloadedFiles.length >= maxResults) {
          break
        }

        attempts = 0 // Reset attempts if successful
      } catch (e) {
        console.error(`Error during search: ${e}`)
        attempts++
      } finally {
        if (driver) {
          await driver.quit()
        }
      }

      if (downloadedFiles.length < maxResults) {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.DELAY_BETWEEN_ATTEMPTS),
        )
      }
    }

    console.log(`Total files downloaded: ${downloadedFiles.length}`)
    return downloadedFiles
  }

  async getUserInput(): Promise<UserInput> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const question = (query: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(query, resolve)
      })
    }

    const query = await question('Enter your search query: ')
    const fileType =
      (await question('Enter file type (default: pdf): ')) || 'pdf'
    const maxResultsStr = await question(
      'Enter maximum number of results (default: 10): ',
    )
    const maxResults = parseInt(maxResultsStr) || 10

    rl.close()

    return { query, fileType, maxResults }
  }

  async run(): Promise<void> {
    try {
      const { query, fileType, maxResults } = await this.getUserInput()

      const downloadedFiles = await this.searchAndDownload(
        query,
        fileType,
        maxResults,
      )

      if (downloadedFiles.length > 0) {
        console.log('\nDownloaded files:')
        downloadedFiles.forEach((file) =>
          console.log(`${file.path} (from ${file.url})`),
        )
      } else {
        console.log('No files were downloaded.')
      }
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}

const app = new FileSearchAndDownload()
app.run()
