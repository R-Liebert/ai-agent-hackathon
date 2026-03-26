import React from "react";
import { useTranslation } from "react-i18next";
import FormTabSelecor from "../../components/Global/FormTabSelector";
import FormDropdownSelector from "../../components/Global/FormDropdownSelector";
import { HiOutlineDesktopComputer } from "react-icons/hi";
import SystemInformationAccordion from "../../components/Global/AccordionForm";
import ReferenceFileUpload from "./ReferenceFileUpload";
import FormLabel from "../../components/Global/FormLabel";
import FormTextarea from "../../components/Global/FormTextarea";

interface BugReportFormProps {
  impactLevelOptions: { value: string; label: string }[];
  formik: any;
  handleImpactLevelChange: (value: string) => void;
  handleErrorFrequencyChange: (value: string) => void;
  errorFrequencyOptions: { value: string; label: string }[];
  deviceTypeOptions: { value: string; label: string }[];
  operatingSystemOptions: { value: string; label: string }[];
  browserTypeOptions: { value: string; label: string }[];
  handleFilesChange: (files: File[]) => void;
  uploadedFiles: File[];
}

const BugReportForm: React.FC<BugReportFormProps> = ({
  formik,
  impactLevelOptions,
  handleImpactLevelChange,
  handleErrorFrequencyChange,
  errorFrequencyOptions,
  deviceTypeOptions,
  operatingSystemOptions,
  browserTypeOptions,
  handleFilesChange,
  uploadedFiles,
}) => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col w-full">
      {/* Description of the issue */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t("feedback:forms:bugReportForm.issueDescription.label")}
          tooltipText={t(
            "feedback:forms:bugReportForm.issueDescription.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.bugReport.issueDescription}
          onChange={(e) =>
            formik.setFieldValue("bugReport.issueDescription", e.target.value)
          }
          placeholder={t(
            "feedback:forms:bugReportForm.issueDescription.placeholder"
          )}
          formTouched={formik.touched.bugReport?.issueDescription}
          formError={formik.errors.bugReport?.issueDescription}
        />
      </div>

      {/* Expected Behaviour */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t("feedback:forms:bugReportForm.expectedBehaviour.label")}
          tooltipText={t(
            "feedback:forms:bugReportForm.expectedBehaviour.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.bugReport.expectedBehaviour}
          onChange={(e) =>
            formik.setFieldValue("bugReport.expectedBehaviour", e.target.value)
          }
          placeholder={t(
            "feedback:forms:bugReportForm.expectedBehaviour.placeholder"
          )}
          formTouched={formik.touched.bugReport?.expectedBehaviour}
          formError={formik.errors.bugReport?.expectedBehaviour}
        />
      </div>

      {/* Steps to Reproduce the Issue */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t("feedback:forms:bugReportForm.stepsToReproduceIssue.label")}
          tooltipText={t(
            "feedback:forms:bugReportForm.stepsToReproduceIssue.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.bugReport.stepsToReproduceIssue}
          onChange={(e) =>
            formik.setFieldValue(
              "bugReport.stepsToReproduceIssue",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms:bugReportForm.stepsToReproduceIssue.placeholder"
          )}
          formTouched={formik.touched.bugReport?.stepsToReproduceIssue}
          formError={formik.errors.bugReport?.stepsToReproduceIssue}
        />
      </div>

      {/* Error Frequency */}
      <FormTabSelecor
        options={errorFrequencyOptions}
        value={formik.values.bugReport.errorFrequency}
        label={t("feedback:forms:bugReportForm.errorFrequency.label")}
        onChange={handleErrorFrequencyChange}
        tooltipText={t("feedback:forms:bugReportForm.errorFrequency.tooltip")}
        hasErrorValidation={true}
        fieldTouched={formik.touched.bugReport?.errorFrequency}
        fieldError={formik.errors.bugReport?.errorFrequency}
      />

      {/* Workflow Impact Description 
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t(
            "feedback:forms:bugReportForm.workflowImpactDescription.label"
          )}
          tooltipText={t(
            "feedback:forms:bugReportForm.workflowImpactDescription.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.bugReport.workflowImpactDescription}
          onChange={(e) =>
            formik.setFieldValue(
              "bugReport.workflowImpactDescription",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms:bugReportForm.workflowImpactDescription.placeholder"
          )}
        />
      </div>*/}

      {/* Workflow Severity Impact Level */}
      <FormTabSelecor
        options={impactLevelOptions}
        value={formik.values.bugReport.workflowSeverityImpactLevel}
        label={t(
          "feedback:forms:bugReportForm.workflowSeverityImpactLevel.label"
        )}
        onChange={handleImpactLevelChange}
        tooltipText={t(
          "feedback:forms:bugReportForm.workflowSeverityImpactLevel.tooltip"
        )}
      />
      {/* Supporting Reference - Files Upload */}
      <ReferenceFileUpload
        label={t("feedback:forms:bugReportForm.supportingReference.label")}
        tooltipText={t(
          "feedback:forms:bugReportForm.supportingReference.tooltip"
        )}
        dropAreaHeader={t(
          "feedback:forms:bugReportForm.supportingReference.placeholders.title"
        )}
        dropAreaSubheader={t(
          "feedback:forms:bugReportForm.supportingReference.placeholders.subtitle"
        )}
        dropAreaSubheaderFiletypes="Supported formats:"
        allowedFileTypes={[
          { contentType: "image/png", fileExtension: ".png" },
          { contentType: "image/jpeg", fileExtension: ".jpg" },
          { contentType: "application/pdf", fileExtension: ".pdf" },
          { contentType: "video/mp4", fileExtension: ".mp4" },
          { contentType: "video/quicktime", fileExtension: ".mov" },
          { contentType: "video/x-msvideo", fileExtension: ".avi" },
        ]}
        maxFileSize={50}
        maxNumberOfFiles={3}
        files={uploadedFiles}
        onChange={handleFilesChange}
      />

      {/* Error Messages */}
      <div className="flex flex-col w-full mt-2 mb-6">
        <FormLabel
          label={t("feedback:forms:bugReportForm.errorMessages.label")}
        />
        <FormTextarea
          value={formik.values.bugReport.errorMessages}
          onChange={(e) =>
            formik.setFieldValue("bugReport.errorMessages", e.target.value)
          }
          placeholder={t(
            "feedback:forms:bugReportForm.errorMessages.placeholder"
          )}
        />
      </div>
      {/* System Information Accordion */}
      <SystemInformationAccordion
        label={t("feedback:forms.bugReportForm.systemInformation.label")}
        icon={<HiOutlineDesktopComputer size={32} strokeWidth={1.6} />}
      >
        <div className="flex flex-col overflow-visible my-10">
          <div className="flex gap-10 flex-col">
            {/* Operating System */}
            <FormDropdownSelector
              value={formik.values.bugReport.systemInformation.operatingSystem}
              onChange={(value) =>
                formik.setFieldValue(
                  "bugReport.systemInformation.operatingSystem",
                  value
                )
              }
              options={operatingSystemOptions}
              label={t(
                "feedback:forms.bugReportForm.systemInformation.operatingSystem.label"
              )}
            />

            {/* Browser Type */}
            <FormDropdownSelector
              value={formik.values.bugReport.systemInformation.browserType}
              onChange={(value) =>
                formik.setFieldValue(
                  "bugReport.systemInformation.browserType",
                  value
                )
              }
              options={browserTypeOptions}
              label={t(
                "feedback:forms.bugReportForm.systemInformation.browserType.label"
              )}
            />
          </div>
          {/* Device Type */}
          <FormTabSelecor
            options={deviceTypeOptions}
            value={formik.values.bugReport.systemInformation.deviceType}
            label={t(
              "feedback:forms.bugReportForm.systemInformation.deviceType.label"
            )}
            onChange={(value) =>
              formik.setFieldValue(
                "bugReport.systemInformation.deviceType",
                value
              )
            }
          />
        </div>
      </SystemInformationAccordion>
    </section>
  );
};

export default BugReportForm;
