import { Skeleton } from "@mui/material";
import { workspacesService } from "../../services/workspacesService";
import { useQuery } from "@tanstack/react-query";
import imageStorageUtil, {
  LocalStorageItem,
} from "../../utils/imageStorageUtil";
import { arrayBufferToBase64 } from "../../utils/encodingUtils";

export type Size = "sm" | "md" | "lg";

interface Dimensions {
  width: string;
  height: string;
}

type WorkspaceAvatarProps = {
  imageUrl: string | undefined;
  size: Size;
  color?: string;
  alt?: string;
  onClick?: (imageUrl: string) => void;
};

const sizeMap: Record<Size, Dimensions> = {
  sm: { width: "18px", height: "18px" },
  md: { width: "56px", height: "56px" },
  lg: { width: "96px", height: "96px" },
};

const altTextClassMap: Record<Size, string> = {
  sm: "w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs pb-[2px] font-semibold",
  md: "w-[56px] h-[56px] rounded-full flex items-center justify-center text-white text-4xl font-semibold",
  lg: "w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl font-bold",
};

// test
const WorkspaceAvatar = ({
  imageUrl,
  size,
  color,
  alt,
  onClick,
}: WorkspaceAvatarProps) => {
  // Check if imageUrl is a data URL
  const isDataUrl = imageUrl?.startsWith("data:");

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workspace-image", imageUrl],
    queryFn: async () => {
      if (!imageUrl) {
        return null;
      }

      // If it's a data URL, return it directly
      if (isDataUrl) {
        return {
          data: imageUrl,
          fileName: "custom-image",
          contentType: "image/*",
          svg: false,
        } as LocalStorageItem;
      }

      const localStorageItem = await imageStorageUtil.get(imageUrl);
      if (localStorageItem != null) {
        return localStorageItem;
      }

      const response = await workspacesService.getWorkspaceImage(imageUrl);
      const contentType = response.headers["content-type"];

      const data = arrayBufferToBase64(response.data as ArrayBuffer);

      const item = {
        data: data,
        fileName: imageUrl,
        contentType: contentType,
        svg: contentType.indexOf("image/svg") >= 0,
      } as LocalStorageItem;

      try {
        imageStorageUtil.save(imageUrl, item);
      } catch (err) {
        console.error(
          "Error while attempting to save the image to the image storage database.",
          err
        );
      }

      return item;
    },
    staleTime: 31 * 24 * 60 * 60 * 1000,
    retry: 3,
    enabled: !!imageUrl, // Only run query if imageUrl exists
  });

  const selectedSize = sizeMap[size];

  if (isLoading && !isDataUrl) {
    return (
      <Skeleton
        variant="circular"
        sx={{
          background: "#eee",
          width: selectedSize.width,
          height: selectedSize.height,
        }}
      />
    );
  }

  if (isError || response == null) {
    if (color && alt) {
      return (
        <div
          className={altTextClassMap[size]}
          style={{
            backgroundColor: color || "#000000",
          }}
        >
          {alt}
        </div>
      );
    }
    return null;
  }

  // For data URLs, use them directly. For base64 data, construct data URI
  const finalImageUrl = isDataUrl
    ? response.data
    : `data:${response.contentType};base64,${response.data}`;

  return (
    <div
      onClick={() => {
        if (onClick && imageUrl) {
          onClick(imageUrl);
        }
      }}
      style={{
        minWidth: selectedSize.width,
        height: selectedSize.height,
        backgroundImage: `url(${finalImageUrl})`,
        borderRadius: "50%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: response.svg ? "cover" : "100%",
      }}
    />
  );
};

export default WorkspaceAvatar;
