import { EventHandler } from "./event-handler";
import { IMessage, IMessageWithStatus, IQueue, PriorityType } from "./types";

export class QueueHandler {
  private static instance: QueueHandler;

  static getInstance(): QueueHandler {
    if (!QueueHandler.instance) {
      QueueHandler.instance = new QueueHandler();
    }

    return QueueHandler.instance;
  }

  private constructor() {
    this.addToQueue = this.addToQueue.bind(this);
  }

  private queue: IQueue = {
    critical: [],
    high: [],
    normal: [],
  };

  private eventHandler = EventHandler.getInstance();
  private _msgNumberToSend = 5;
  private _consumers: string[] = [];

  set consumer(consumer: string) {
    this._consumers.push(consumer);
  }

  set msgNumberToSend(numberToSend: number) {
    if (numberToSend < 1) {
      console.log("You must set a value to send at least 1 message");
      return;
    }
    this._msgNumberToSend = numberToSend;
  }

  private addToQueue(message: IMessage): void {
    this.queue[message.priority].push({
      ...message,
      status: { sent: [], handled: [] },
    });
  }

  private getMessagesToSend(consumer: string) {
    const messages: IMessage[] = [];

    const criticalMsgsPending = this.getMsgsByCategory(
      "critical",
      consumer,
      this.msgNumberToSend,
    );
    if (criticalMsgsPending.length >= this._msgNumberToSend) {
      return criticalMsgsPending.slice(0, this._msgNumberToSend);
    }
    messages.push(...criticalMsgsPending);

    let diff = this._msgNumberToSend - messages.length;
    const highMsgsPending = this.getMsgsByCategory("high", consumer, diff);
    if (highMsgsPending.length >= diff) {
      messages.push(...highMsgsPending.slice(0, diff));
      return messages;
    }
    messages.push(...highMsgsPending);

    diff = this._msgNumberToSend - messages.length;
    const normalMsgsPending = this.getMsgsByCategory("normal", consumer, diff);
    if (normalMsgsPending.length >= diff) {
      messages.push(...normalMsgsPending.slice(0, diff));
      return messages;
    }
    messages.push(...normalMsgsPending);

    return messages;
  }

  private getMsgsByCategory(
    category: PriorityType,
    consumer: string,
    limit: number,
  ) {
    const messages: IMessage[] = [];

    for (const msg of this.queue[category]) {
      if (msg.status.sent.includes(consumer)) continue;
      messages.push({
        id: msg.id,
        message: msg.message,
        priority: msg.priority,
      });

      if (messages.length === limit) break;
    }

    return messages;
  }

  public run(): void {
    this.eventHandler.addNewMessageOn(this.addToQueue);

    // TODO: emit by every consumers

    setInterval(() => {
      for (const consumer of this._consumers) {
        const msgs = this.getMessagesToSend(consumer).map((m) => [
          m.priority,
          m.id,
        ]);
        console.log(msgs);
      }
    }, 1000);
  }
}
