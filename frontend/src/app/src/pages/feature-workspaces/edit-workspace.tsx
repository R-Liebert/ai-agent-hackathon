import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  WorkspaceDetailsResponse,
  WorkspaceSettingsDto,
  WorkspaceMemberDto,
  WorkspaceFileDto,
  WorkspaceUpdateRequest,
  ConversationStarterDto,
} from "../../models/workspace-model";
import { workspacesService } from "../../services/workspacesService";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import MainNav from "../../components/MainNavigation/MainNavigation";
import Heading from "../../components/Global/AppHeading";
import { useRouteChanger } from "../../utils/navigation";
import { useMsal } from "@azure/msal-react";
import EditWorkspaceForm from "../../components/Workspaces/edit-workspace-form";
import Loader from "../../components/app-loader";
import { useTranslation } from "react-i18next";
import { notificationsService } from "../../services/notificationsService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Helmet } from "react-helmet-async";
import { toTitleCase } from "../../utils/stringUtils";
import GlobalContainer from "../../components/Global/AppContainer";
import Tooltip from "../../components/Global/Tooltip";
import { TbArrowBarToDown } from "react-icons/tb";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";
import {
  convertPersonaToBackend,
  convertPersonaToUI,
} from "../../utils/personaConverters";
import ConfirmActionDialog from "../../components/Global/ConfirmActionDialog";

type EditWorkspaceFormValues = {
  workspaceId: string;
  imageUrl: string;
  name: string;
  description: string;
  members: WorkspaceMemberDto[];
  filesToAdd: WorkspaceFileDto[];
  filesToRemove: WorkspaceFileDto[];
  persona: {
    detailLevel: string;
    interactionStyle: string;
    systemMessage: string;
  };
  isConservative: boolean;
  showCitations: boolean;
  isFileAccessRestrictedForMembers: boolean;
  emailNotificationsDisabled: boolean;
  advancedFileAnalysis: boolean;
  systemMessageOverride: boolean;
  conversationStarters: ConversationStarterDto[];
};

const EditWorkspacePage = () => {
  const { workspaceId } = useParams();
  const { changeRoute } = useRouteChanger();
  const { accounts } = useMsal();
  const { t } = useTranslation();
  const userId = accounts[0]?.localAccountId;
  const [showOverrideEmptyDialog, setShowOverrideEmptyDialog] = useState(false);
  const overrideEmptyConfirmRequestedRef = useRef(false);

  const {
    data: workspaceSettings,
    isLoading: isWorkspaceSettingsLoading,
    error: workspaceDetailsError,
    isError: isWorkspaceDetailsError,
  } = useQuery<WorkspaceSettingsDto, AxiosError>({
    queryKey: ["workspace-settings"],
    queryFn: () => workspacesService.getWorkspaceSettings(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });

  const queryClient = useQueryClient();
  const { mutateAsync: updateWorkspace, isPending } = useMutation({
    mutationFn: async (model: WorkspaceUpdateRequest) => {
      // Check if workspaceId is defined
      if (!workspaceId) {
        throw new Error("workspaceId is required for updating the workspace");
      }
      return await workspacesService.update(workspaceId, model);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspaces", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["workspace-details", workspaceId],
        }),
      ]);
    },
    onError: (error: AxiosError, variables, context) => {
      console.error("Error submitting edit workspace form:", error);
    },
  });

  const {
    data: workspaceDetails,
    isLoading,
    error: workspaceSettingsError,
    isError: isWorkspaceSettingsError,
  } = useQuery<WorkspaceDetailsResponse, AxiosError>({
    queryKey: ["workspace-details", workspaceId],
    queryFn: () => workspacesService.get(workspaceId!.toString()),
    enabled: workspaceId != undefined,
    retry: (_, error) => {
      return error?.request?.status != 403;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });

  const getWorkspaceMembers = (): WorkspaceMemberDto[] => {
    return workspaceDetails?.members || [];
  };

  const getInitialValues = (): EditWorkspaceFormValues => {
    // Convert persona from backend format (may have numbers) to UI format (strings)
    const convertedPersona = convertPersonaToUI(workspaceDetails?.persona) || {
      detailLevel: "Default",
      interactionStyle: "Default",
      systemMessage: "",
    };

    return {
      workspaceId: workspaceId!,
      imageUrl: workspaceDetails?.imageUrl || "",
      name: workspaceDetails?.name || "",
      description: workspaceDetails?.description || "",
      members: getWorkspaceMembers(),
      filesToAdd: [],
      filesToRemove: [],
      persona: convertedPersona,
      isConservative: workspaceDetails?.isConservative ?? false,
      showCitations: workspaceDetails?.showCitations ?? false,
      isFileAccessRestrictedForMembers:
        workspaceDetails?.isFileAccessRestrictedForMembers ?? false,
      emailNotificationsDisabled:
        workspaceDetails?.emailNotificationsDisabled ?? false,
      advancedFileAnalysis: workspaceDetails?.advancedFileAnalysis ?? false,
      systemMessageOverride: workspaceDetails?.systemMessageOverride ?? false,
      conversationStarters:
        workspaceDetails && workspaceDetails.conversationStarters?.length > 0
          ? workspaceDetails.conversationStarters
          : [{ id: uuidv4(), content: "" }],
    };
  };

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

  const isOverrideEnabledWithEmptyMessage = (values: EditWorkspaceFormValues) => {
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

  const formik = useFormik<EditWorkspaceFormValues>({
    initialValues: getInitialValues(),
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      if (
        isOverrideEnabledWithEmptyMessage(values) &&
        !overrideEmptyConfirmRequestedRef.current
      ) {
        setShowOverrideEmptyDialog(true);
        return;
      }
      overrideEmptyConfirmRequestedRef.current = false;

      const currentMembers = getWorkspaceMembers() || [];

      // Check for pending file uploads
      if (values.filesToAdd) {
        var pendingFiles = values.filesToAdd.filter(
          (x) => x.status === "Pending"
        );
        if (pendingFiles && pendingFiles.length > 0) {
          notificationsService.warn(
            `There are still files being uploaded. Please wait until all files have finished uploading.`
          );
          return;
        }
      }

      const membersToRemove = currentMembers.filter(
        (member: WorkspaceMemberDto) =>
          !values.members.some(
            (selectedMember: WorkspaceMemberDto) =>
              selectedMember.id === member.id
          )
      );

      const membersToAdd = values.members.filter(
        (member: WorkspaceMemberDto) =>
          !membersToRemove.some(
            (existingMember: WorkspaceMemberDto) =>
              existingMember.id === member.id
          )
      );

      // Convert persona string values to numbers for backend
      const personaWithNumbers = convertPersonaToBackend(values.persona);

      let workspaceData: WorkspaceUpdateRequest = {
        workspaceId: workspaceId!,
        name: values.name !== workspaceDetails?.name ? values.name : undefined,
        description: values.description,
        imageUrl:
          values.imageUrl !== workspaceDetails?.imageUrl
            ? values.imageUrl
            : undefined,
        filesToAdd: values.filesToAdd || [],
        filesToRemove: values.filesToRemove || [],
        membersToAdd,
        membersToRemove,
        persona:
          values.persona.systemMessage !==
            workspaceSettings?.persona?.systemMessage ||
          values.persona.interactionStyle !==
            workspaceSettings?.persona?.interactionStyle ||
          values.persona.detailLevel !== workspaceSettings?.persona?.detailLevel
            ? personaWithNumbers
            : undefined,
        isConservative: values.isConservative,
        showCitations: values.showCitations,
        advancedFileAnalysis: formik.values.advancedFileAnalysis,
        systemMessageOverride: values.systemMessageOverride,
        isFileAccessRestrictedForMembers:
          values.isFileAccessRestrictedForMembers,
        emailNotificationsDisabled: values.emailNotificationsDisabled,
        conversationStarters: values.conversationStarters,
      };

      console.log("Form values before submission:", values);
      console.log("Data being submitted:", workspaceData);

      try {
        await updateWorkspace(workspaceData);
        notificationsService.success(
          t("workspaces:edit.notifications.success")
        );
        changeRoute(`/workspaces/${workspaceId}`);
      } catch (error) {
        console.error("Error updating workspace:", error);
        const axiosError = error as AxiosError;
        if (axiosError && axiosError.status == 400) {
          try {
            const errorData = Object.entries(axiosError.response?.data as any);
            const errorCode =
              errorData && errorData.length > 0 ? errorData[0][0] : undefined;
            if (errorCode) {
              notificationsService.error(
                t(`workspaces:edit.notifications.${errorCode.toLowerCase()}`)
              );
              return;
            }
          } catch {}
        }
        notificationsService.error(t("workspaces:edit.notifications.error"));
      }
    },
  });

  useEffect(() => {
    if (workspaceDetails) {
      formik.setValues(getInitialValues());
    }
  }, [workspaceDetails]);

  const getWorkspaceSettings = () => {
    const persona = workspaceDetails?.persona || workspaceSettings?.persona;

    // Convert numeric values to strings if needed for UI
    const convertedPersona = convertPersonaToUI(persona);

    return {
      persona: convertedPersona,
      files: workspaceSettings?.files,
    } as WorkspaceSettingsDto;
  };

  const onCancelClick = () => {
    changeRoute(`/workspaces/${workspaceId}`);
  };

  const getWorkspaceFiles = (): WorkspaceFileDto[] => {
    const existingWorkspaceFiles: WorkspaceFileDto[] =
      workspaceDetails?.files || [];

    const filesToRemove = formik.values.filesToRemove || [];

    const currentFiles = existingWorkspaceFiles.filter(
      (file) => !filesToRemove.includes(file)
    );

    // ?.map((file) => ({
    //   id: "", // Temporary or empty ID since it's not uploaded
    //   fileName: file.name,
    //   contentType: file.type,
    //   contentLength: file.size,
    //   status: "Pending", // Frontend-only status
    //   uploadedAt: new Date(), // Optional
    // }))

    const newFiles: WorkspaceFileDto[] = formik.values.filesToAdd || [];

    // Combine existing and new files
    return [...currentFiles, ...newFiles];
  };

  const onRemoveWorkspaceFile = (workspaceFile: WorkspaceFileDto) => {
    // Check if this is a new file or an existing file
    const isNewFile = workspaceFile.id === "" || !workspaceFile.id;

    if (isNewFile) {
      // Handle new files (filter from filesToAdd)
      const updatedFilesToAdd = formik.values.filesToAdd.filter(
        (file) => file.fileName !== workspaceFile.fileName
      );
      formik.setFieldValue("filesToAdd", updatedFilesToAdd);
    } else {
      // Handle existing files (add to filesToRemove)
      const filesToRemove = [
        ...(formik.values.filesToRemove || []),
        workspaceFile,
      ];
      formik.setFieldValue("filesToRemove", filesToRemove);
    }

    notificationsService.success(
      `${t("workspaces:common.notifications.removeFile.textOne")} "${
        workspaceFile.fileName
      }" ${t("workspaces:common.notifications.removeFile.textTwo")}`,
      4000
    );
  };

  const handleSaveChanges = () => {
    formik.submitForm();
  };

  if (isLoading || isWorkspaceSettingsLoading) {
    return <Loader />;
  }

  if (isWorkspaceSettingsError || isWorkspaceDetailsError) {
    const error = workspaceSettingsError || workspaceDetailsError;
    console.error(error);
    if (error?.request?.status) {
      switch (error.request.status) {
        case 401:
        case 403:
          changeRoute("/access-denied");
          break;
        default:
          changeRoute("/server-error");
      }
    }
  }

  return (
    <>
      <Helmet>
        <title>
          {workspaceDetails
            ? `Edit  ${toTitleCase(workspaceDetails.name)} - AI Launchpad`
            : "Edit Workspace"}
        </title>
        <meta
          name="description"
          content={
            workspaceDetails
              ? `Edit  ${toTitleCase(workspaceDetails.name)} Page`
              : "Edit Workspace Page"
          }
        />
      </Helmet>
      <MainNav
        title={t("workspaces:edit:textTitle")}
        buttonRight={
          <button
            className="flex cursor-pointer outline-none height-auto width-auto fixed top-2 right-12 p-2 rounded-lg z-[99] active:outline-none active:ring-6 active:ring-opacity-10 active:ring-transparent hover:bg-gray-600 hover:text-superwhite transition-all duration-300 ease-out"
            aria-label={t("workspaces:common:saveChangesButton")}
            onClick={handleSaveChanges}
          >
            <div className="relative group">
              <TbArrowBarToDown
                size={24}
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
            id="edit-workspace"
            className="flex flex-col max-w-3xl mx-auto pb-20 px-4 sm:px-12 overflow-x-visible"
          >
            <Heading
              titleKey="workspaces:edit:textTitle"
              taglineKey="workspaces:edit:textTagline"
            />
            <EditWorkspaceForm
              files={getWorkspaceFiles()}
              settings={getWorkspaceSettings()}
              advancedFileAnalysis={workspaceDetails?.advancedFileAnalysis}
              isFileAccessRestrictedForMembers={
                workspaceDetails?.isFileAccessRestrictedForMembers
              }
              emailNotificationsDisabled={
                workspaceDetails?.emailNotificationsDisabled
              }
              onFormCanceled={onCancelClick}
              formik={formik}
              onRemoveWorkspaceFile={onRemoveWorkspaceFile}
              getWorkspaceFiles={getWorkspaceFiles}
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

export default EditWorkspacePage;
