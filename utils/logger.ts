export class Logger {
  static log(message: string, context: string): void {
    console.log(`[${context}] ${message}`)
  }

  static error(message: string, context: string): void {
    console.error(`[${context}] ERROR: ${message}`)
  }

  static warn(message: string, context: string): void {
    console.warn(`[${context}] WARNING: ${message}`)
  }
}
