import EventEmitter from "node:events";
import { IMessage } from "./types";

export class EventHandler {
  private static instance: EventHandler;

  static getInstance(): EventHandler {
    if (!EventHandler.instance) {
      EventHandler.instance = new EventHandler();
    }

    return EventHandler.instance;
  }

  private constructor() {}

  private eventEmitter = new EventEmitter();

  public addNewMessageEmit(message: IMessage): void {
    this.eventEmitter.emit("add_new_message", message);
  }

  public addNewMessageOn(callback: (msg: IMessage) => void): void {
    this.eventEmitter.on("add_new_message", callback);
  }

  public sendMessagesEmit(consumer: string, messages: IMessage) {
    this.eventEmitter.emit(consumer, messages);
  }
}
