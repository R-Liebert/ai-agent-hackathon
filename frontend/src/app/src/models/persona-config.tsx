export interface IUserSettings {
  userId?: string;
  chatPersona: IPersonaConfiguration;
  preferedLanguage: string | null;
}

export interface IPersonaConfiguration {
  systemMessage: string | null;
  interactionStyle: string | number;
  detailLevel: string | number;
}

export class PersonaConfig implements IPersonaConfiguration {
  systemMessage: string | null;
  interactionStyle: string | number;
  detailLevel: string | number;

  constructor(systemMessage: string | null, interactionStyle: string | number, detailLevel: string | number) {
    this.systemMessage = systemMessage;
    this.interactionStyle = interactionStyle;
    this.detailLevel = detailLevel;
  }
}

export class UserSettings implements IUserSettings {
  userId?: string;
  chatPersona: PersonaConfig;
  preferedLanguage: string | null;

  constructor(userId: string | undefined, chatPersona: PersonaConfig, preferedLanguage: string | null) {
    this.userId = userId;
    this.chatPersona = chatPersona;
    this.preferedLanguage = preferedLanguage;
  }
}
