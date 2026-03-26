interface IChatConversationOptions {
  language?: string;
}

export class ChatConversationOptions implements IChatConversationOptions {
  language?: string;

  constructor(language?: string) {
    this.language = language;
  }
}
