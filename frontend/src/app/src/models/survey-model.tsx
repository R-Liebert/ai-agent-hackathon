export interface Survey {
  id: number;
  link: string;
  header: string;
  body: string;
  path: string;
  expirationDate: string;
}

export interface SurveyAnswer {
  surveyId: number;
  answerType: string;
  answeredOn: Date;
}
