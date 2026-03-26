import { requestApiType } from "../pages/feature-job-post-creator/types";
import axiosInstance from "./axiosInstance";
import { encodeToBase64 } from "../utils/encodingUtils";

export const generateJobPost = async (
  data: requestApiType,
  userId: string
) => {
  const requestBody = {
    userId: userId || null,
    ...data,
  };
  return axiosInstance
    .post("/jobpostcreator", requestBody)
    .then((res) => res)
    .catch((error) => {
      return (
        (error?.response?.data?.error && error?.response?.data?.error) ||
        error.response.message
      );
    });
};

export const exportJobPost = async (
  data: string,
  fileName: string
) => {
  const encodedData = encodeToBase64(data);
  return axiosInstance
    .post("/jobpostcreator/export", encodedData, {
      responseType: "blob",
    })
    .then((res) => {
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error(error);
    });
};

export const EditFieldJobPost = async (
  data: requestApiType,
  field: string
) => {
  const requestBody = {
    ...data,
  };
  return axiosInstance
    .post(`/jobpostcreator/${field}`, requestBody)
    .then((res) => res.data).catch((error) => {
      return (
        (error?.response?.data?.error && error?.response?.data?.error) ||
        error.response.message
      );
    });
};
