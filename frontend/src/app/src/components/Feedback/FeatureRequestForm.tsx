import React from "react";
import { useTranslation } from "react-i18next";
import FormTabSelecor from "../../components/Global/FormTabSelector";
import ReferenceFileUpload from "./ReferenceFileUpload";
import FormLabel from "../../components/Global/FormLabel";
import FormTextarea from "../../components/Global/FormTextarea";

interface FeatureRequestFormProps {
  impactLevelOptions: { value: string; label: string }[];
  formik: any;
  handleImpactLevelChange: (value: string) => void;
  handleFilesChange: (files: File[]) => void;
  uploadedFiles: File[];
}

const FeatureRequestForm: React.FC<FeatureRequestFormProps> = ({
  formik,
  impactLevelOptions,
  handleImpactLevelChange,
  handleFilesChange,
  uploadedFiles,
}) => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col w-full">
      {/* Feature Description */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t(
            "feedback:forms:featureRequestForm.featureDescription.label"
          )}
          tooltipText={t(
            "feedback:forms:featureRequestForm.featureDescription.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.featureRequest.featureDescription}
          onChange={(e) =>
            formik.setFieldValue(
              "featureRequest.featureDescription",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms:featureRequestForm.featureDescription.placeholder"
          )}
          formTouched={formik.touched.featureRequest?.featureDescription}
          formError={formik.errors.featureRequest?.featureDescription}
        />
      </div>

      {/* Problem Statement */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t("feedback:forms:featureRequestForm.problemStatement.label")}
          tooltipText={t(
            "feedback:forms:featureRequestForm.problemStatement.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.featureRequest.problemStatement}
          onChange={(e) =>
            formik.setFieldValue(
              "featureRequest.problemStatement",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms:featureRequestForm.problemStatement.placeholder"
          )}
          formTouched={formik.touched.featureRequest?.problemStatement}
          formError={formik.errors.featureRequest?.problemStatement}
        />
      </div>

      {/* Use Case Scenario */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t("feedback:forms:featureRequestForm.useCaseScenario.label")}
          tooltipText={t(
            "feedback:forms:featureRequestForm.useCaseScenario.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.featureRequest.useCaseScenario}
          onChange={(e) =>
            formik.setFieldValue(
              "featureRequest.useCaseScenario",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms:featureRequestForm.useCaseScenario.placeholder"
          )}
          formTouched={formik.touched.featureRequest?.useCaseScenario}
          formError={formik.errors.featureRequest?.useCaseScenario}
        />
      </div>

      {/* Workflow Severity Impact Level */}
      <FormTabSelecor
        options={impactLevelOptions}
        value={formik.values.featureRequest.workflowSeverityImpactLevel}
        label={t(
          "feedback:forms:featureRequestForm.workflowSeverityImpactLevel.label"
        )}
        onChange={handleImpactLevelChange}
        tooltipText={t(
          "feedback:forms:featureRequestForm.workflowSeverityImpactLevel.tooltip"
        )}
        fieldError={formik.errors.featureRequest?.workflowSeverityImpactLevel}
        fieldTouched={
          formik.touched.featureRequest?.workflowSeverityImpactLevel
        }
        hasErrorValidation={true}
      />
      {/* Supporting Reference - Files Upload */}
      <ReferenceFileUpload
        label={t("feedback:forms:featureRequestForm.supportingReference.label")}
        tooltipText={t(
          "feedback:forms:featureRequestForm.supportingReference.tooltip"
        )}
        dropAreaHeader={t(
          "feedback:forms:featureRequestForm.supportingReference.placeholders.title"
        )}
        dropAreaSubheader={t(
          "feedback:forms:featureRequestForm.supportingReference.placeholders.subtitle"
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

      {/* Other Information */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t("feedback:forms:featureRequestForm.otherInformation.label")}
        />
        <FormTextarea
          value={formik.values.featureRequest.otherInformation}
          onChange={(e) =>
            formik.setFieldValue(
              "featureRequest.otherInformation",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms:featureRequestForm.otherInformation.placeholder"
          )}
        />
      </div>
    </section>
  );
};

export default FeatureRequestForm;
