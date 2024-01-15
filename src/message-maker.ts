import { randomUUID } from "node:crypto";
import { IMessage, PriorityType } from "./types";
import { getRandomNumber } from "./utils";
import { EventHandler } from "./event-handler";

export class MessageMaker {
  constructor(private readonly eventHandler: EventHandler) {
    this.createMessageByInterval();
  }

  private priorities: PriorityType[] = ["critical", "high", "normal"];

  private createMessage(): IMessage {
    const id = randomUUID();
    const priority = this.priorities[getRandomNumber(0, 2)];
    return {
      id,
      message: `[${priority}] - ${id}`,
      priority,
    };
  }

  private createMessageByInterval(): IMessage | void {
    setInterval(() => {
      if (Math.random() > 0.5) {
        this.eventHandler.addNewMessage(this.createMessage());
      }
    }, 1000);
  }
}
