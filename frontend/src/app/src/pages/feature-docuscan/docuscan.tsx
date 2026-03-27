import {
  Button,
  CircularProgress,
  Container,
  Grid,
  IconButton,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import { DropzoneProps, useDropzone } from "react-dropzone";
import MainNav from "../../components/MainNavigation/MainNavigation";
import axiosInstance from "../../services/axiosInstance";
import { enqueueSnackbar } from "notistack";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import ClearIcon from "@mui/icons-material/Clear";
import SendIcon from "@mui/icons-material/Send";
import { useTranslation } from "react-i18next";
import { ChatFooter } from "../../components/Chat/ChatFooter";
//import { ChatConversation } from "../../models/chat-conversation";
import { ChatdialogueBox } from "../../components/Chat/ChatDialogueBox";
import { useMsalApi } from "../../services/auth";
import { useMsal } from "../../hooks/useMsalMock";
import { MdOutlineDocumentScanner } from "react-icons/md";
import { notificationsService } from "../../services/notificationsService";
import { Helmet } from "react-helmet-async";
import GlobalContainer from "../../components/Global/AppContainer";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const DocuScan: React.FC = () => {
  const { t } = useTranslation();
  const { accounts } = useMsal();
  const { getTokentWithScopes } = useMsalApi();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    accept: ACCEPTED_FILE_TYPES,
  } as DropzoneProps);

  const sendFileToBackend = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post("/docuscan/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${file.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      notificationsService.success(t("docuscan:messages.success"));
    } catch (error) {
      notificationsService.error(t("docuscan:messages.error"));
    }

    setIsLoading(false);
  }, [file]);

  const clearFile = useCallback(() => {
    setFile(null);
  }, []);

  return (
    <>
      <Helmet>
        <title>Document Converter - AI Launchpad</title>
        <meta name="description" content="Document Converter Page" />
      </Helmet>
      <MainNav title={t("docuscan:menuAppBar.title")} />
      <PageTransitionContainer>
        <GlobalContainer>
          <div
            id="docuscan"
            className="container max-w-2xl mx-auto flex flex-col tracking-normal px-4 sm:px-12 md:px-5 relative mt-6"
          >
            {!file && (
              <>
                <ChatdialogueBox
                  agentAvatarColor="#E07058"
                  displayName={accounts[0]?.name || ""}
                  dialogue={[]}
                  key={1}
                  welcomeMessage={t("docuscan:welcomeMessage")}
                  moduleName={t("docuscan:moduleName")}
                  Icon={MdOutlineDocumentScanner}
                  chatType="DocumentConverter"
                  chatId="docuscan"
                />

                <div
                  {...getRootProps()}
                  className={`flex min-h-96 items-center justify-center border-2 border-dashed border-gray-400 p-4 text-center ${
                    isDragActive ? "border-blue-500" : "border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <DocumentScannerIcon className="text-gray-400 !text-5xl mb-3" />
                    {isDragActive ? (
                      <p className="text-gray-400">
                        {t("docuscan:dropzone.activeText")}
                      </p>
                    ) : (
                      <p className="text-gray-400">
                        {t("docuscan:dropzone.description")}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
            {file && (
              <>
                <div className="border border-[#565869] rounded-[8px] p-3 mb-3 flex items-center w-full">
                  <span className="text-lg font-semibold">{file.name}</span>
                  <IconButton
                    onClick={clearFile}
                    disabled={isLoading || !file}
                    className=" focus:outline-none !ml-auto"
                  >
                    <ClearIcon className="!text-3xl text-red-700 hover:text-black border border-red-700 hover:bg-red-800 focus:outline-none focus:ring-red-300 rounded-lg text-center dark:border-red-500 dark:text-red-500 dark:hover:text-black dark:hover:bg-red-600 dark:focus:ring-red-900" />
                  </IconButton>
                </div>
                <div className="border border-[#565869] rounded-[8px] p-4 relative flex justify-center">
                  {file.type === "application/pdf" ? (
                    <embed
                      src={URL.createObjectURL(file)}
                      className="h-[70vh] w-full"
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="max-h-[70vh]"
                    />
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <CircularProgress
                        size={48}
                        style={{ color: "#FF7F50" }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
            <Button
              variant="contained"
              endIcon={
                isLoading ? (
                  <CircularProgress size={20} style={{ color: "black" }} />
                ) : (
                  <SendIcon />
                )
              }
              onClick={sendFileToBackend}
              disabled={isLoading || !file}
              size="large"
              className="!mt-6 disabled:opacity-50 w-full !bg-[#FF7F50] !text-black !shadow-none"
            >
              {isLoading
                ? t("docuscan:buttons.processing")
                : t("docuscan:buttons.process")}
            </Button>
            <ChatFooter />
            <div className="input-notes !pb-6">
              {t("common:inputNotes")}{" "}
              <a
                href="https://dsbintranet.sharepoint.com/sites/trAIn_/SitePages/Guidelines-for-ansvarlig-brug-af-AI.aspx?web=1"
                aria-label="guidelines"
                target="_blank"
                style={{ cursor: "pointer", color: "inherit" }}
              >
                {t("common:guidelines")}
              </a>{" "}
              &{" "}
              <a
                href="https://dsbintranet.sharepoint.com/sites/trAIn_/SitePages/Release-notes.aspx"
                aria-label="release notes"
                target="_blank"
                style={{ cursor: "pointer", color: "inherit" }}
              >
                {t("common:releaseNotes")}
              </a>
            </div>
          </div>
        </GlobalContainer>
      </PageTransitionContainer>
    </>
  );
};

export default React.memo(DocuScan);
