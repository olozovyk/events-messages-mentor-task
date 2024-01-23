import { EventHandler } from "./event-handler";
import { IConsumer, IMessage, IQueue, PriorityType } from "./types";

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
    this.deleteHandledMsg = this.deleteHandledMsg.bind(this);
  }

  private _interval: number = 1000;
  private eventHandler = EventHandler.getInstance();
  private _consumers: IConsumer = {};

  public setInterval(intervalMs: number): this {
    if (intervalMs < 0) return this;

    this._interval = intervalMs;
    return this;
  }

  set consumer({
    consumer,
    msgNumber = 5,
  }: {
    consumer: string;
    msgNumber: number;
  }) {
    this._consumers[consumer] = {
      availableNumberMsgs: msgNumber,
    };
  }

  private queue: IQueue = {
    critical: [],
    high: [],
    normal: [],
  };

  /**
   * Places each message in a subqueue with the appropriate priority. This
   * eliminates the need for complex searches for each output message.
   */
  private addToQueue(message: IMessage): void {
    this.queue[message.priority].push({
      ...message,
      status: {
        sent: [],
        handled: [],
      },
    });
  }

  /**
   * Goes through each category subqueue until the required number of unsent
   * messages for a consumer is picked.
   */
  private getMsgsToSend(consumer: string, numberMsgsToSend: number) {
    const messages: IMessage[] = [];

    const criticalMsgsPending = this.getMsgsByCategory(
      "critical",
      consumer,
      numberMsgsToSend,
    );
    if (criticalMsgsPending.length >= numberMsgsToSend) {
      return criticalMsgsPending.slice(0, numberMsgsToSend);
    }

    messages.push(...criticalMsgsPending);
    let diff = numberMsgsToSend - messages.length;

    const highMsgsPending = this.getMsgsByCategory("high", consumer, diff);
    if (highMsgsPending.length >= diff) {
      messages.push(...highMsgsPending.slice(0, diff));
      return messages;
    }

    messages.push(...highMsgsPending);
    diff = numberMsgsToSend - messages.length;

    const normalMsgsPending = this.getMsgsByCategory("normal", consumer, diff);
    if (normalMsgsPending.length >= diff) {
      messages.push(...normalMsgsPending.slice(0, diff));
      return messages;
    }

    messages.push(...normalMsgsPending);
    return messages;
  }

  /**
   * Picks messages from a specific subqueue and marks each picked message as sent
   * to a specific consumer (adds the consumer to the sent array).
   */
  private getMsgsByCategory(
    category: PriorityType,
    consumer: string,
    limit: number,
  ) {
    const messages: IMessage[] = [];

    for (const msg of this.queue[category]) {
      if (msg.status.sent.includes(consumer)) continue;
      if (messages.length === limit) break;

      messages.push({
        id: msg.id,
        message: msg.message,
        priority: msg.priority,
      });
      msg.status.sent.push(consumer);
    }

    return messages;
  }

  /**
   * Sends messages to consumers and decrements the counter of available
   * messages for a specific consumer.
   */
  private sendMsgsToConsumer() {
    for (const consumer of Object.keys(this._consumers)) {
      if (this._consumers[consumer].availableNumberMsgs === 0) continue;

      const msgs = this.getMsgsToSend(
        consumer,
        this._consumers[consumer].availableNumberMsgs,
      );

      if (!msgs.length) continue;

      this._consumers[consumer].availableNumberMsgs -= msgs.length;
      this.eventHandler.sendMsgsEmit(consumer, msgs);
    }
  }

  private findMsgPriorityAndIdx(id: string): {
    priority: PriorityType | undefined;
    idx: number | undefined;
  } {
    let priority: PriorityType | undefined;
    let idx: number | undefined;

    type KeyQueueType = keyof typeof this.queue;

    out: for (const key of Object.keys(this.queue)) {
      for (let i = 0; i < this.queue[key as KeyQueueType].length; i++) {
        const msg = this.queue[key as KeyQueueType][i];

        if (msg.id !== id) continue;

        priority = msg.priority;
        idx = i;
        break out;
      }
    }

    return { priority, idx };
  }

  /**
   * Marks a message as handled and deletes it  from the queue if all consumers
   * have handled the message.
   */
  private deleteHandledMsg({
    id,
    consumer,
  }: {
    id: string;
    consumer: string;
  }): void {
    const { priority, idx } = this.findMsgPriorityAndIdx(id);
    if (priority === undefined || idx === undefined) return;

    const msg = this.queue[priority][idx];
    msg.status.handled.push(consumer);

    let isMsgHandled: boolean = true;

    const consumers = Object.keys(this._consumers);

    consumers.forEach((consumer) => {
      if (!msg.status.handled.includes(consumer)) {
        isMsgHandled = false;
      }
    });

    if (!isMsgHandled) return;

    this.queue[priority].splice(idx, 1);
    consumers.forEach((consumer) => {
      // Increases the counter of available messages for a specific consumer:
      this._consumers[consumer].availableNumberMsgs += 1;
    });
  }

  public run(): void {
    this.eventHandler.addNewMsgOn(this.addToQueue);
    this.eventHandler.getHandledMsgOn(this.deleteHandledMsg);

    setInterval(() => {
      this.sendMsgsToConsumer();

      // just to print number of msgs in the queue:
      const msgNumber = Object.values(this.queue).reduce<number>(
        (acc, msgs) => {
          if (!Array.isArray(msgs)) return acc;
          acc += msgs.length;
          return acc;
        },
        0,
      );
      console.log(msgNumber, "messages in the queue");
    }, this._interval);
  }
}
