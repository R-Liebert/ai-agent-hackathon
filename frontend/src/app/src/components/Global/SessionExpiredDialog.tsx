import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { msalInstance } from "../../App";
import { useSessionStore } from "../../stores/sessionStore";
import ModalContainer from "./ModalContainer";

export default function SessionExpiredDialog() {
  const { t } = useTranslation();
  const isExpired = useSessionStore((s) => s.isExpired);
  const clearExpired = useSessionStore((s) => s.clearExpired);
  const drainQueue = useSessionStore((s) => s.drainQueue);

  // Cross-tab recovery listener
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth:recovered") {
        clearExpired();
        drainQueue();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearExpired, drainQueue]);

  if (!isExpired) return null;

  return (
    <ModalContainer
      open={isExpired}
      title={t("components:sessionExpiredDialog.title")}
      onClose={() => clearExpired()}
      width="max-w-md"
    >
      <div className="md:px-6 px-4 py-5 w-full flex flex-col h-auto border-none outline-none">
        <p className="text-gray-300">
          {t("components:sessionExpiredDialog.message")}
        </p>
        <div className="flex w-full justify-end pt-2 place-content-center gap-4 mt-4">
          <button
            aria-label={t("components:sessionExpiredDialog.buttons.cancel")}
            className="flex place-content-center place-items-center rounded-full px-6 py-3 font-medium bg-gray-400 text-white-200 hover:bg-gray-650 hover:text-white-100 focus:bg-gray-650 focus:text-white-100 font-body transition-color transition-background duration-300 ease-in-out"
            onClick={() => clearExpired()}
          >
            {t("components:sessionExpiredDialog.buttons.cancel")}
          </button>
          <button
            aria-label={t("components:sessionExpiredDialog.buttons.signIn")}
            className="flex place-content-center place-items-center rounded-full px-6 py-3 bg-white-200 hover:bg-red-700 hover:text-white-100 font-body text-gray-600 font-semibold transition-color transition-background duration-300 ease-in-out"
            onClick={async () => {
              try {
                await msalInstance.loginPopup();
                clearExpired();
                await drainQueue();
                try {
                  localStorage.setItem("auth:recovered", Date.now().toString());
                } catch {}
              } catch {
                msalInstance.loginRedirect();
              }
            }}
          >
            {t("components:sessionExpiredDialog.buttons.signIn")}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
