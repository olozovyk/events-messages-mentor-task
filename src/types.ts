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

type IQueueMapped = {
  [key in PriorityType]: IMessageWithStatus[];
};

export interface IQueue extends IQueueMapped {}
