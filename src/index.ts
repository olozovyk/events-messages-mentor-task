import { MessageMaker } from "./message-maker";
import { QueueHandler } from "./queue-handler";

const bootstrap = () => {
  QueueHandler.getInstance().run();
  new MessageMaker().run();
};

bootstrap();
