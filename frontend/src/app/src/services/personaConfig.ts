import axiosInstance from "./axiosInstance";

const updateConfiguration = async (configuration: { [id: string]: string }) => {
  const requestBody = {
    configuration: Object.assign({}, {}, configuration),
  };

  return axiosInstance
    .put("/persona", requestBody)
    .then((res) => res)
    .catch((error) => {
      return (
        (error?.response?.data?.error && error?.response?.data?.error) ||
        error.response.message
      );
    });
};

export const setLanguage = async (langCode: string) => {
  return await updateConfiguration({
    PreferedLanguage: langCode,
  });
};

export const getConfiguration = async () => {
  return axiosInstance
    .get("/persona")
    .then((res) => res)
    .catch((error) => {
      return (
        (error?.response?.data?.error && error?.response?.data?.error) ||
        error.response.message
      );
    });
};
