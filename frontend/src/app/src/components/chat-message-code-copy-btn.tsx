import { MouseEvent, useState } from "react";
import "./chat-message-code-copy-btn.css";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";

type CodeCopyBtnProps = {
  children: React.ReactNode;
};

export default function CodeCopyBtn({ children }: CodeCopyBtnProps) {
  const [copyOk, setCopyOk] = useState(false);

  const { t } = useTranslation();

  const handleClick = () => {
    const codeToString = children?.toString();
    if (codeToString && codeToString?.length > 0) {
      navigator.clipboard.writeText(codeToString);
      setCopyOk(true);
      setTimeout(() => {
        setCopyOk(false);
      }, 2500);
    }
  };

  return (
    <div className="code-copy">
      <div className="code-copy-btn" onClick={handleClick}>
        {copyOk ? (
          <>
            <CheckIcon />
            <span className={`icon-text`}>
              {t('components:codeCopyBtn.message')}
            </span>
          </>
        ) : (
          <>
            <ContentCopyIcon />
            <span className={`icon-text`}>
              {t('components:codeCopyBtn.icon.label')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
