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

  private constructor() {
    this.eventEmitter.on("error", (e) => {
      console.log(e().message);
    });
  }

  private eventEmitter = new EventEmitter();

  public addNewMsgEmit(message: IMessage): void {
    this.eventEmitter.emit("add_new_message", message);
  }

  public addNewMsgOn(callback: (msg: IMessage) => void): void {
    this.eventEmitter.on("add_new_message", callback);
  }

  public sendMsgsEmit(consumer: string, messages: IMessage[]): void {
    this.eventEmitter.emit(consumer, messages);
  }

  public receiveMsgsOn(
    consumer: string,
    callback: (msg: IMessage[]) => void,
  ): void {
    this.eventEmitter.on(consumer, callback);
  }

  public markMsgHandledEmit(id: string, consumer: string): void {
    this.eventEmitter.emit("handled", { id, consumer });
  }

  public getHandledMsgOn(
    callback: ({ id, consumer }: { id: string; consumer: string }) => void,
  ): void {
    this.eventEmitter.on("handled", callback);
  }
}
