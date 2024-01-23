import { randomUUID } from "node:crypto";
import { IMessage, PriorityType } from "./types";
import { getRandomNumber } from "./utils";
import { EventHandler } from "./event-handler";

export class MessageMaker {
  private static priorities: PriorityType[] = ["critical", "high", "normal"];

  constructor() {
    this.createMessage = this.createMessage.bind(this);
  }

  private _interval: number = 1000;

  public setInterval(intervalMs: number): this {
    if (intervalMs < 0) return this;

    this._interval = intervalMs;
    return this;
  }

  private eventHandler = EventHandler.getInstance();

  private createMessage(): IMessage {
    const id = randomUUID();
    const priority = MessageMaker.priorities[getRandomNumber(0, 2)];

    return {
      id,
      message: `[${priority}] - ${id}`,
      priority,
    };
  }

  public run(): void {
    setInterval(() => {
      this.eventHandler.addNewMsgEmit(this.createMessage());
    }, this._interval);
  }
}
