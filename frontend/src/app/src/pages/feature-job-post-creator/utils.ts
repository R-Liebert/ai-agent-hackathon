import { createPromptFieldType } from "./types";

export const getTitle = (fieldId: string) => {
  let titleName = "";
  switch (fieldId) {
    case "appetizer":
      titleName = "Appetizer";
      break;
    case "header":
      titleName = "Header";
      break;
    case "jobDescription":
      titleName = "Job description";
      break;
    case "qualifications":
      titleName = "Qualifications";
      break;
    case "shortIntroduction":
      titleName = "Short introduction";
      break;
    case "teamDescription":
      titleName = "Team description";
      break;
    default:
      break;
  }
  return titleName;
};

export const getTitleReverted = (fieldId: string): string => {
  let titleName = "";
  switch (fieldId) {
    case "Appetizer":
      titleName = "appetizer";
      break;
    case "Header":
      titleName = "header";
      break;
    case "Job Description":
      titleName = "jobDescription";
      break;
    case "Qualifications":
      titleName = "qualifications";
      break;
    case "Short Introduction":
      titleName = "shortIntroduction";
      break;
    case "Team Description":
      titleName = "teamDescription";
      break;
    default:
      break;
  }
  return titleName;
};

export const getValueOfField = (
  data: createPromptFieldType[],
  fieldId: string
) => {
  let res = "";
  data.forEach((el) => {
    if (el.id == fieldId) {
      res = el.value;
    }
  });
  return res;
};
export const getLanguageConverted = (language: string) => {
  if (language == "Danish") {
    return "0";
  } else if (language == "English") {
    return "1";
  } else {
    return "1";
  }
};
