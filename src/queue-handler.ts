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

  private eventHandler = EventHandler.getInstance();
  private _consumers: IConsumer = {};

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

  private addToQueue(message: IMessage): void {
    this.queue[message.priority].push({
      ...message,
      status: {
        sent: [],
        handled: [],
      },
    });
  }

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

  private deleteHandledMsg({ id, consumer }: { id: string; consumer: string }) {
    let priority: PriorityType | undefined;
    let idx: number | undefined;

    // find msg in the queue - the priority and the index in the priority array:
    type KeyQueueType = keyof typeof this.queue;

    out: for (const key of Object.keys(this.queue)) {
      for (let i = 0; i < this.queue[key as KeyQueueType].length; i++) {
        const msg = this.queue[key as KeyQueueType][i];

        if (msg.id === id) {
          priority = msg.priority;
          idx = i;
          break out;
        }
      }
    }

    if (priority === undefined || idx === undefined) return;

    const msg = this.queue[priority][idx];

    msg.status.handled.push(consumer);

    // check should I delete the message. Did all consumers handle the message?
    const consumers = Object.keys(this._consumers);

    /* If at least one existed consumer is absent in the handled array - flag 
    false, message won't be deleted */
    let isMsgHandled: boolean = true;

    consumers.forEach((consumer) => {
      if (!msg.status.handled.includes(consumer)) {
        isMsgHandled = false;
      }
    });

    if (isMsgHandled) {
      this.queue[priority].splice(idx, 1);
      consumers.forEach((consumer) => {
        this._consumers[consumer].availableNumberMsgs += 1;
      });
    }
  }

  public run(): void {
    this.eventHandler.addNewMsgOn(this.addToQueue);
    this.eventHandler.getHandledMsgOn(this.deleteHandledMsg);

    setInterval(() => {
      for (const consumer of Object.keys(this._consumers)) {
        if (this._consumers[consumer].availableNumberMsgs === 0) continue;

        const msgs = this.getMsgsToSend(
          consumer,
          this._consumers[consumer].availableNumberMsgs,
        );

        if (msgs.length) {
          this._consumers[consumer].availableNumberMsgs -= msgs.length;
          this.eventHandler.sendMsgsEmit(consumer, msgs);
        }
      }

      // just to print number of msgs:
      const msgNumber = Object.values(this.queue).reduce<number>(
        (acc, msgs) => {
          if (!Array.isArray(msgs)) return acc;
          acc += msgs.length;
          return acc;
        },
        0,
      );
      console.log(msgNumber, "messages in the queue");
    }, 1000);
  }
}
