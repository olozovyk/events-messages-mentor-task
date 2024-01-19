const priorities = ["critical", "high", "normal"] as const;
export type PriorityType = (typeof priorities)[number];

export interface IMessage {
  id: string;
  message: string;
  priority: PriorityType;
}

export interface IMessageWithStatus extends IMessage {
  status: {
    sent: string[];
    handled: string[];
  };
}

type QueueMapped = {
  [key in PriorityType]: IMessageWithStatus[];
};

export interface IQueue extends QueueMapped {}

type InnerQueueMapped = {
  [key in PriorityType]: IMessage[];
};

export interface IInnerQueue extends InnerQueueMapped {}

export interface IConsumer {
  [key: string]: {
    availableNumberMsgs: number;
  };
}
