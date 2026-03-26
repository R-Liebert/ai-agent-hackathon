import axiosInstance from "./axiosInstance";

export const searchUsersInEntraID = async (name: string) => {
  const response = await axiosInstance.get(`/users/entra/search?name=${name}`);
  const users = response.data;
  return users;
};

export const getProfilePicture = async (userId: string) => {
  const response = await axiosInstance.post(
    `/users/profile-picture?userId=${userId}`
  );
  return response.data;
};

export const usersService = {
  searchUsersInEntraID,
  getProfilePicture,
};
