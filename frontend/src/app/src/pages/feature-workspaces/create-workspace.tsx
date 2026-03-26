import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import MainNav from "../../components/MainNavigation/MainNavigation";
import Heading from "../../components/Global/AppHeading";
import { useRouteChanger } from "../../utils/navigation";
import CreateWorkspaceForm from "../../components/Workspaces/create-workspace-form";
import {
  WorkspaceSettingsDto,
  CreateWorkspaceDto,
  WorkspaceMemberDto,
  WorkspaceFileDto,
  ConversationStarterDto,
} from "../../models/workspace-model";
import { workspacesService } from "../../services/workspacesService";
import Loader from "../../components/app-loader";
import { useTranslation } from "react-i18next";
import { notificationsService } from "../../services/notificationsService";
import { useMsal } from "@azure/msal-react";
import { generateHighContrastColor } from "../../utils/colorUtils";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Helmet } from "react-helmet-async";
import GlobalContainer from "../../components/Global/AppContainer";
import Tooltip from "../../components/Global/Tooltip";
import { TbArrowBarToDown } from "react-icons/tb";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";
import { convertPersonaToBackend } from "../../utils/personaConverters";
import ConfirmActionDialog from "../../components/Global/ConfirmActionDialog";

const CreateWorkspacePage = () => {
  const { changeRoute } = useRouteChanger();
  const { t } = useTranslation();
  const { workspaceId } = useParams();
  const { accounts } = useMsal();
  const queryClient = useQueryClient();
  const [showOverrideEmptyDialog, setShowOverrideEmptyDialog] = useState(false);
  const overrideEmptyConfirmRequestedRef = useRef(false);

  const { data: workspaceSettings, isLoading } = useQuery<WorkspaceSettingsDto>(
    {
      queryKey: ["workspace-settings"],
      queryFn: () => workspacesService.getWorkspaceSettings(),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
    }
  );

  const userId = accounts[0]?.localAccountId;

  const { mutateAsync: createWorkspace, isPending } = useMutation({
    mutationFn: workspacesService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", userId] });
      notificationsService.success(
        t("workspaces:create.notifications.success")
      );
      changeRoute(`/workspaces/${data.id}`);
    },
    onError: (error: AxiosError) => {
      if (error.status == 400) {
        notificationsService.error(error.response?.data as string);
      } else {
        notificationsService.error(t("workspaces:create.notifications.error"));
      }
      console.error(error);
      throw error;
    },
  });

  const conversationStarterSchema = Yup.object<ConversationStarterDto>().shape({
    content: Yup.string()
      .optional()
      .min(3, t("workspaces:common.form.conversationStarters.minCharacters"))
      .max(80, t("workspaces:common.form.conversationStarters.maxCharacters")),
  });

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, t("workspaces:common.form.nameValidations.minCharacters"))
      .max(50, t("workspaces:common.form.nameValidations.maxCharacters"))
      .required(t("workspaces:common.form.nameValidations.noData")),
    members: Yup.array().of(Yup.object<WorkspaceMemberDto>()).optional(),
    conversationStarters: Yup.array().of(conversationStarterSchema).optional(),
  });

  const isOverrideEnabledWithEmptyMessage = (values: CreateWorkspaceDto) => {
    return (
      values.systemMessageOverride &&
      (!values.persona?.systemMessage ||
        values.persona.systemMessage.trim().length === 0)
    );
  };

  const handleConfirmOverrideEmpty = () => {
    overrideEmptyConfirmRequestedRef.current = true;
    setShowOverrideEmptyDialog(false);
    formik.submitForm();
  };

  const handleCancelOverrideEmpty = () => {
    setShowOverrideEmptyDialog(false);
  };

  const formik = useFormik<CreateWorkspaceDto>({
    initialValues: {
      workspaceId: workspaceId!,
      name: "",
      description: "",
      members: [],
      workspaceFiles: [],
      imageUrl: "",
      color: "",
      isConservative: false,
      showCitations: false,
      isFileAccessRestrictedForMembers: false,
      emailNotificationsDisabled: false,
      systemMessageOverride: false,
      persona: workspaceSettings?.persona || {
        detailLevel: "Default",
        interactionStyle: "Default",
        systemMessage: "",
      },
      advancedFileAnalysis: false,
      conversationStarters: [{ id: uuidv4(), content: "" }],
    },
    validationSchema,
    onSubmit: async (values) => {
      if (
        isOverrideEnabledWithEmptyMessage(values) &&
        !overrideEmptyConfirmRequestedRef.current
      ) {
        setShowOverrideEmptyDialog(true);
        return;
      }
      overrideEmptyConfirmRequestedRef.current = false;

      const color = generateHighContrastColor();

      if (values.workspaceFiles) {
        var pendingFiles = values.workspaceFiles.filter(
          (x) => x.status === "Pending"
        );
        if (pendingFiles && pendingFiles.length > 0) {
          notificationsService.warn(
            `There are still files being uploaded. Please wait until all files have finished uploading.`
          );
          return;
        }
      }

      // Convert persona string values to numbers for backend
      const personaWithNumbers = convertPersonaToBackend(values.persona);

      await createWorkspace({ ...values, persona: personaWithNumbers, color });
    },
  });

  const handleReturnBack = () => {
    changeRoute("/workspaces");
  };

  const handleSaveChanges = () => {
    formik.submitForm();
  };

  const customAutoHideDuration = 4000;

  const onRemoveWorkspaceFile = (workspaceFile: WorkspaceFileDto) => {
    const updatedFiles = formik.values.workspaceFiles.filter(
      (file) => file.fileName !== workspaceFile.fileName
    );
    formik.setFieldValue("workspaceFiles", updatedFiles);
    notificationsService.success(
      `${t("workspaces:common.notifications.removeFile.textOne")} "${
        workspaceFile.fileName
      }" ${t("workspaces:common.notifications.removeFile.textTwo")}`,
      customAutoHideDuration
    );
  };

  if (isLoading || !workspaceSettings) return <Loader />;

  return (
    <>
      <Helmet>
        <title>Create Workspace - AI Launchpad </title>
        <meta name="description" content="Create Workspace Page" />
      </Helmet>
      <MainNav
        title={t("workspaces:create:textTitle")}
        buttonRight={
          <button
            className="flex cursor-pointer outline-none height-auto width-auto fixed top-2 right-12 p-2 rounded-lg z-[99] active:outline-none active:ring-6 active:ring-opacity-10 active:ring-transparent hover:bg-gray-600 hover:text-superwhite transition-all duration-300 ease-out"
            aria-label={t("workspaces:common:saveChangesButton")}
            onClick={handleSaveChanges}
          >
            <div className="relative group">
              <TbArrowBarToDown
                size={22}
                strokeWidth={1.4}
                className="text-superwhite"
              />
              <Tooltip
                text="workspaces:common:saveChangesButton"
                position="-right-3 -bottom-10"
              />
            </div>
          </button>
        }
      />
      <PageTransitionContainer>
        <GlobalContainer>
          <div
            id="create-workspace"
            className="!relative flex flex-col max-w-3xl mx-auto pb-20 px-4 sm:px-12 overflow-x-hidden"
          >
            {" "}
            <Heading
              titleKey="workspaces:create:textTitle"
              taglineKey="workspaces:create:textTagline"
            />
            <CreateWorkspaceForm
              formik={formik}
              onReturn={handleReturnBack}
              onRemoveWorkspaceFile={onRemoveWorkspaceFile}
              workspaceSettings={workspaceSettings}
              getWorkspaceFiles={() => formik.values.workspaceFiles}
              isPending={isPending}
            />
          </div>
        </GlobalContainer>
      </PageTransitionContainer>
      <ConfirmActionDialog
        open={showOverrideEmptyDialog}
        title={t(
          "workspaces:common:form:systemMessageOverride.confirmModal.title"
        )}
        message={t(
          "workspaces:common:form:systemMessageOverride.confirmModal.message"
        )}
        cancelBtn={t(
          "workspaces:common:form:systemMessageOverride.confirmModal.cancel"
        )}
        confirmBtn={t(
          "workspaces:common:form:systemMessageOverride.confirmModal.confirm"
        )}
        onCancel={handleCancelOverrideEmpty}
        onClose={handleCancelOverrideEmpty}
        onConfirm={handleConfirmOverrideEmpty}
        isLoading={isPending}
        confirmButtonColor="warning"
      />
    </>
  );
};

export default CreateWorkspacePage;
