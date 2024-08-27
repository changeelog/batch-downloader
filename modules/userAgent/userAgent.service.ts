import { CONFIG } from '../../config/config'
import { IUserAgentService } from './userAgent.types'

export class UserAgentService implements IUserAgentService {
  getRandomUserAgent(): string {
    return CONFIG.USER_AGENTS[
      Math.floor(Math.random() * CONFIG.USER_AGENTS.length)
    ]
  }
}
