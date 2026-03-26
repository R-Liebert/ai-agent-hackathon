export interface IChatMessageCitation {
  title: string;
  filepath: string;
  url: string;
}

export class ChatMessageCitation implements IChatMessageCitation {
  title: string;
  filepath: string;
  url: string;

  constructor(title: string, filepath: string, url: string) {
    this.title = title;
    this.filepath = filepath;
    this.url = url;
  }
}
