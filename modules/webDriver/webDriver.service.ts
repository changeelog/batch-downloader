import {
  Builder,
  By,
  Key,
  until,
  WebDriver,
  WebElement,
} from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'
import { Proxy } from '../../types/common.types'
import { IWebDriverService } from './webDriver.types'
import { IUserAgentService } from '../userAgent/userAgent.types'

export class WebDriverService implements IWebDriverService {
  constructor(private userAgentService: IUserAgentService) {}

  async setupDriver(proxy?: Proxy): Promise<WebDriver> {
    const options = new Options()
    options.addArguments(
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=1920,1080',
    )
    if (proxy) {
      options.addArguments(
        `--proxy-server=${proxy.protocol}://${proxy.host}:${proxy.port}`,
      )
    }
    const userAgent = this.userAgentService.getRandomUserAgent()
    options.addArguments(`user-agent=${userAgent}`)
    console.log(`Using User-Agent: ${userAgent}`)
    return new Builder().forBrowser('chrome').setChromeOptions(options).build()
  }

  async performSearch(
    driver: WebDriver,
    query: string,
    fileType: string,
  ): Promise<void> {
    await driver.get('https://www.google.com')
    await driver.wait(until.elementLocated(By.tagName('body')), 20000)

    try {
      const searchBox = await driver.wait(
        until.elementLocated(By.name('q')),
        10000,
      )
      const searchQuery = `${query} filetype:${fileType}`
      await searchBox.sendKeys(searchQuery, Key.RETURN)
      await driver.wait(until.elementLocated(By.tagName('h3')), 10000)
    } catch (e) {
      console.error(`Error in performSearch: ${e}`)
      throw e
    }
  }

  async getFileLinks(driver: WebDriver, maxResults: number): Promise<string[]> {
    const links: string[] = []
    while (links.length < maxResults) {
      const results: WebElement[] = await driver.findElements(By.css('h3'))
      const newLinks: string[] = await Promise.all(
        results.map(async (result) => {
          const parent = await result.findElement(By.xpath('./..'))
          return parent.getAttribute('href')
        }),
      )
      links.push(...newLinks.filter((link): link is string => link !== null))

      if (links.length >= maxResults) {
        break
      }

      try {
        const nextButton = await driver.findElement(By.id('pnnext'))
        await driver.executeScript('arguments[0].click();', nextButton)
        await driver.sleep(2000) // Wait for the page to load
      } catch {
        break
      }
    }

    return links.slice(0, maxResults)
  }
}
