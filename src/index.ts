import { EventHandler } from "./event-handler";
import { MessageMaker } from "./message-maker";

const eventEmitter = EventHandler.getInstance().eventEmitter;

new MessageMaker(EventHandler.getInstance());

eventEmitter.on("add_new_message", (message) => {
  console.log(message);
});
