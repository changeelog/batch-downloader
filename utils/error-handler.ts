export class ErrorHandler {
  static handle(error: Error, context: string): void {
    console.error(`Error in ${context}:`, error.message)
    // Здесь можно добавить более сложную логику обработки ошибок,
    // например, отправку уведомлений или запись в файл логов
  }
}
