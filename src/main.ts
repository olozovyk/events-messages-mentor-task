import { Consumer } from "./consumer";
import { MessageMaker } from "./message-maker";
import { QueueHandler } from "./queue-handler";

const bootstrap = async () => {
  QueueHandler.getInstance().setInterval(500).run();

  new MessageMaker().setInterval(500).run();

  new Consumer()
    .setMsgNumber(10)
    .setRunDelay(5_000)
    .setHandlingInterval(500)
    .run();
};

bootstrap();
