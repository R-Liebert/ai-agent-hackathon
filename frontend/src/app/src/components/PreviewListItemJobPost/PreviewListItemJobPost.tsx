import React from "react";
import PencilSVG from "../../assets/icons/pencil.svg?react";

import { previewResponse } from "../../pages/feature-job-post-creator/types";
import { Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";

interface AnimatedBackgroundProps {
  item: previewResponse;
  isLoading: boolean;
  handleEditClick: () => void;
}

export const PreviewListItemJobPost: React.FC<AnimatedBackgroundProps> = ({
  isLoading,
  item,
  handleEditClick,
}) => {
  const { t } = useTranslation();
  const titleClass =
    item.title == "Header"
      ? "preview-description title"
      : "preview-description";
  const PrintLoading = () => {
    const components = [];
    let rowsNumber = 0;
    switch (item.title) {
      case "Header":
      case t("job-post-creator:preview.sections.header"):
        rowsNumber = 1;
        break;
      case "Appetizer":
      case t("job-post-creator:preview.sections.appetizer"):
        rowsNumber = 2;
        break;
      case "Short Introduction":
      case t("job-post-creator:preview.sections.shortIntroduction"):
        rowsNumber = 2;
        break;

      default:
        rowsNumber = 3;
    }
    {
      for (let index = 0; index < rowsNumber; index++) {
        components.push(<Skeleton sx={{ bgcolor: "#51515D" }} />);
      }
    }
    return <div>{components}</div>;
  };
  return (
    <div className={`preview-generated-item visible`}>
      <p className="preview-title">{item?.title && item?.title}</p>
      {isLoading ? (
        <PrintLoading />
      ) : (
        <>
          {" "}
          <p
            className={titleClass}
            dangerouslySetInnerHTML={{
              __html: item?.description[item?.currentVariant].replace(
                /\n/g,
                "<br />"
              ),
            }}
          ></p>
          <div className="preview-generated-pencil right-0 top-0 flex items-center">
            <button
              onClick={() => handleEditClick()}
              className="cursor-pointer text-inherit py-2 font-medium !rounded-md mt-0.5 mr-1"
            >
              <PencilSVG />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
