import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
interface NewBtnProps {
  buttonClick: () => void;
}

export const ChatNewBtn = ({ buttonClick }: NewBtnProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        className="!text-white-100 !border-[#686868] !normal-case !font-normal w-full"
        onClick={buttonClick}
      >
        {t("components:chatNewBtn.label")}
      </Button>
    </>
  );
};
