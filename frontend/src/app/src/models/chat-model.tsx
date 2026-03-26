export interface IChatModel {
  key: string;
  description: string;
  defaultModel: boolean;
  name: string;
}

export class ChatModel implements IChatModel {
  key: string;
  description: string;
  defaultModel: boolean;
  name: string;

  constructor(
    key: string,
    description: string,
    defaultModel: boolean,
    name: string
  ) {
    this.key = key;
    this.description = description;
    this.defaultModel = defaultModel;
    this.name = name;
  }
}
