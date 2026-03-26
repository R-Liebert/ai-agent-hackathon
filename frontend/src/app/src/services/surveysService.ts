import axiosInstance from "./axiosInstance";

const loadSurveys = async () => {
  const response = await axiosInstance.get("/surveys");
  return response.data;
};

const saveSurveyAnswer = async (surveyId: number, answer: string) => {
  const response = await axiosInstance.post(
    `/surveys/${surveyId}/answer?answer=${answer}`,
    null
  );
  return response.data;
};

export const surveysService = {
  loadSurveys,
  saveSurveyAnswer,
};
