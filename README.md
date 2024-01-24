The app implements a message queue example using Node.js events.

To run the application with default parameters, execute the following commands:

```bash
npm install
npm run start:dev
```

The app consists of the following components:

- QueueHandler: This is a singleton class that manages the message queue and dispatches messages to consumers. You can customize the handling interval using the `setInterval()` method, with a default value of 1000 ms. To initiate, use the `run()` method.

- EventHandler: This is a singleton class composed of an EventEmitter instance and additional methods that implement events necessary for the app.

- MessageMaker: This component creates mock messages to be sent to the queue. Similar to QueueHandler, you can set the handling interval using the `setInterval()` method, with a default value of 1000 ms. To initiate, use the `run()` method.

- Consumer: This component receives messages and handles them, in this case, simply printing them to the console. You can configure additional properties such as the maximum number of messages in the consumer (`setMsgNumber()`, default is 5), the handling interval (`setHandlingInterval()`, default is 1000 ms), and a delay for the consumer to start (`setRunDelay()`, by default, there is no delay). To initiate, use the `run()` method.

<br>

You can also add additional parameters using the method chain:

```javascript
QueueHandler.getInstance().setInterval(500).run();

new MessageMaker().setInterval(2000).run();

Consumer.setMsgNumber(10).setHandlingInterval(1500).setRunDelay(3000).run();
```
