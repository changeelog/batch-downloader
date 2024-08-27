import { WebDriver } from 'selenium-webdriver'
import { Proxy } from '../../types/common.types'

export interface IWebDriverService {
  setupDriver(proxy?: Proxy): Promise<WebDriver>
  performSearch(
    driver: WebDriver,
    query: string,
    fileType: string,
  ): Promise<void>
  getFileLinks(driver: WebDriver, maxResults: number): Promise<string[]>
}
