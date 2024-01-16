import { randomUUID } from "node:crypto";
import { IMessage, PriorityType } from "./types";
import { getRandomNumber } from "./utils";
import { EventHandler } from "./event-handler";

export class MessageMaker {
  constructor() {
    this.createMessage = this.createMessage.bind(this);
  }

  private eventHandler = EventHandler.getInstance();

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

  public run(): void {
    setInterval(() => {
      this.eventHandler.addNewMessageEmit(this.createMessage());
    }, 1000);
  }
}
