import EventEmitter from "node:events";
import { IMessage } from "./types";

export class EventHandler {
  private static instance: EventHandler;

  // TODO: change to static
  public eventEmitter = new EventEmitter();

  static getInstance(): EventHandler {
    if (!EventHandler.instance) {
      EventHandler.instance = new EventHandler();
    }

    return EventHandler.instance;
  }

  public addNewMessage(message: IMessage): void {
    this.eventEmitter.emit("add_new_message", message);
  }
}
