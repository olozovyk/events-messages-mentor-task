import { Consumer } from "./consumer";
import { MessageMaker } from "./message-maker";
import { QueueHandler } from "./queue-handler";

const bootstrap = async () => {
  QueueHandler.getInstance().run();
  new MessageMaker().run();

  const consumer1 = new Consumer();
  consumer1.msgNumber = 10;
  consumer1.delayRun = 30_000;
  consumer1.run();

  // const consumer2 = new Consumer();
  // consumer2.msgNumber = 10;
  // consumer2.handlingInterval = 2000;
  // consumer2.delayRun = 10_000;
  // consumer2.run();
};

bootstrap();
