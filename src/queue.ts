import { IMessage, IQueue } from "./types";

const queue: IQueue = {
  critical: [],
  high: [],
  normal: [],
};

// TODO: make singleton

class QueueHandler {
  addToQueue(message: IMessage): void {
    queue[message.priority].push({
      ...message,
      status: {
        sent: false,
        handled: false,
      },
    });
  }

  sendMessages() {}
  deleteMessage() {}
}
