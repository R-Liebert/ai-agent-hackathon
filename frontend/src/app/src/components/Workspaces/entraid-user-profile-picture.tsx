import { UserDto } from "../../models/workspace-model";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "../../services/usersService";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import imageStorageUtil, {
  LocalStorageItem,
} from "../../utils/imageStorageUtil";
import React from "react";

export type EntraIdUserProfilePictureProps = {
  user: UserDto;
  width?: number;
  height?: number;
  fallback?: React.ReactNode;
};

const EntraIdUserProfilePicture: React.FC<EntraIdUserProfilePictureProps> =
  React.memo(({ user, width = 25, height = 25, fallback = null }) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setEnabled(true);
      }, 400);
      return () => clearTimeout(timer);
    }, []);

    const cacheKey = `entraid-profile-picture-${user.id}`;

    const { data: profilePicture, isSuccess } = useQuery({
      queryKey: ["entraid-profile-pictures", user.id],
      queryFn: async () => {
        const fromCache = await imageStorageUtil.get(cacheKey);
        if (fromCache != null) {
          return fromCache?.data != "not-found" ? fromCache.data : null;
        }

        try {
          const profilePictureBase64 = await usersService.getProfilePicture(
            user.id
          );

          await imageStorageUtil.save(cacheKey, {
            data: profilePictureBase64,
            contentType: "base64",
            fileName: user.id,
            svg: false,
          } as LocalStorageItem);

          return profilePictureBase64;
        } catch (error) {
          console.error(error);
          var axiosError = error as AxiosError;
          if (axiosError) {
            if (axiosError?.response?.status == 404) {
              await imageStorageUtil.save(cacheKey, {
                data: "not-found",
                contentType: "base64",
                fileName: user.id,
                svg: false,
              } as LocalStorageItem);
            }
          }
        }

        return null;
      },
      staleTime: 31 * 24 * 60 * 60 * 1000,
      enabled: enabled,
    });

    if (!isSuccess || !profilePicture) {
      return fallback ? <>{fallback}</> : null;
    }

    return (
      <img
        src={`data:image/png;base64,${profilePicture}`}
        width={width}
        height={height}
        style={{ borderRadius: "50%" }}
      />
    );
  });

export default EntraIdUserProfilePicture;
