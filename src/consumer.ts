import { randomUUID } from "node:crypto";
import { EventHandler } from "./event-handler";
import { QueueHandler } from "./queue-handler";
import { delay } from "./utils";
import { IInnerQueue, IMessage, PriorityType } from "./types";

export class Consumer {
  constructor() {
    this.consumeMsgs = this.consumeMsgs.bind(this);
  }

  private _msgNumber: number = 5;
  private _delayRun: number = 0;
  private _handlingInterval: number = 1000;

  private consumerName = randomUUID();
  private readonly eventHandler = EventHandler.getInstance();
  private readonly queueHandler = QueueHandler.getInstance();

  private innerQueue: IInnerQueue = {
    critical: [],
    high: [],
    normal: [],
  };

  public setMsgNumber(msgNumber: number): this {
    if (msgNumber < 0) return this;

    this._msgNumber = msgNumber;
    return this;
  }

  public setRunDelay(delayMs: number): this {
    if (delayMs < 0) return this;

    this._delayRun = delayMs;
    return this;
  }

  public setHandlingInterval(intervalMs: number): this {
    if (intervalMs < 0) return this;

    this._handlingInterval = intervalMs;
    return this;
  }

  /**
   * Adds received messages to inner subqueues to make retrieving messages by priorities easier.
   */
  private consumeMsgs(msgs: IMessage[]) {
    msgs.forEach((msg) => {
      this.innerQueue[msg.priority].push(msg);
    });

    console.log({
      consumer_id: this.consumerName,
      critical: this.innerQueue.critical.length,
      high: this.innerQueue.high.length,
      normal: this.innerQueue.normal.length,
    });
  }

  private handleMessageByPriority(priority: PriorityType) {
    const msg = this.innerQueue[priority][0];

    console.log("\n", "Msg in handling: ", msg.message, "\n");

    this.innerQueue[priority].splice(0, 1);
    this.eventHandler.markMsgHandledEmit(msg.id, this.consumerName);
  }

  private handleMessages(): void {
    setInterval(() => {
      if (this.innerQueue.critical.length) {
        this.handleMessageByPriority("critical");
        return;
      }
      if (this.innerQueue.high.length) {
        this.handleMessageByPriority("high");
        return;
      }
      if (this.innerQueue.normal.length) {
        this.handleMessageByPriority("normal");
        return;
      }
    }, this._handlingInterval);
  }

  public async run(): Promise<void> {
    await delay(this._delayRun);

    this.queueHandler.consumer = {
      consumer: this.consumerName,
      msgNumber: this._msgNumber,
    };

    this.eventHandler.receiveMsgsOn(this.consumerName, this.consumeMsgs);
    this.handleMessages();
  }
}
