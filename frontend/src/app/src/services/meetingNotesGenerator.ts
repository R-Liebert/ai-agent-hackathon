import axiosInstance from "./axiosInstance";

export const getMeetingNotesActions = async (
  inputText: string,
  language: string,
  clientToken: string
) => {
  const chat = {
    prompt: inputText,
    language: language,
  };
  return axiosInstance
    .post("/generator/meeting-notes-actions", chat, {
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    })
    .then((response) => response)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.error ||
          error.response?.message ||
          "An unexpected error occurred"
      );
    });
};

export const getMeetingNotesSummary = async (
  inputText: string,
  language: string,
  clientToken: string
) => {
  const chat = {
    prompt: inputText,
    language: language,
  };
  return axiosInstance
    .post("/generator/meeting-notes-summary", chat, {
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    })
    .then((response) => response)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.error ||
          error.response?.message ||
          "An unexpected error occurred"
      );
    });
};
