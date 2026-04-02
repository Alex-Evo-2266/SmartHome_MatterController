// src/types/Transport.ts
export interface ITransport {
  /**
   * Подключение к транспортному слою (MQTT, WS и т.д.)
   */
  connect(): Promise<void>;

  /**
   * Публикация сообщения в топик
   * @param topic топик/канал
   * @param message объект сообщения
   */
  publish(topic: string, message: any): Promise<void>;

  /**
   * Подписка на сообщения из топика
   * @param topic топик/канал
   * @param callback функция, вызываемая при получении сообщения
   */
  subscribe(topic: string, callback: (message: any) => void): Promise<void>;
}