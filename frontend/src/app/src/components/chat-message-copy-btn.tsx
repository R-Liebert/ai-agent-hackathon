import { MouseEvent, useState } from "react";
import "./chat-message-code-copy-btn.css";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";

type MessageCopyBtnProps = {
  children: React.ReactNode;
};

export default function MessageCopyBtn({ children }: MessageCopyBtnProps) {

  const { t } = useTranslation();

  const [copyOk, setCopyOk] = useState(false);
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (children && Array.isArray(children) && children.length > 0) {
      const firstChild = children[0];
      if (firstChild.props) {
        const childProps = firstChild.props;
        const childText = childProps.children;
        navigator.clipboard.writeText(childText);

        setCopyOk(true);
        setTimeout(() => {
          setCopyOk(false);
        }, 2500);
      }
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
