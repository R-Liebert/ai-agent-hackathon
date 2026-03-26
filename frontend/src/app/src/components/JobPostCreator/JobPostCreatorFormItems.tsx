import React from "react";
import FormLabel from "../Global/FormLabel";
import FormTextarea from "../Global/FormTextarea";
import FormTabSelecor from "../Global/FormTabSelector";
import { useTranslation } from "react-i18next";

interface JobPostCreatorFormItemsProps {
  formik: any;
  positionLevelOptions: { value: string; label: string }[];
  handlePositionLevelChange: (value: string) => void;
  languageOptions: { value: string; label: string }[];
  handleLanguageChange: (value: string) => void;
}

interface StudentPrompt {
  id: string;
  title: string;
  placeholder: string;
}

const JobPostCreatorFormItems: React.FC<JobPostCreatorFormItemsProps> = ({
  formik,
  positionLevelOptions,
  handlePositionLevelChange,
  languageOptions,
  handleLanguageChange,
}) => {
  const { t } = useTranslation();

  // Check if student/junior template is selected - matches old behavior
  const isStudentTemplate = formik.values.positionLevel === "junior";

  // Get student-specific prompts for dynamic field labels (matching old job post creator)
  const studentPrompts = t("job-post-creator:chatDialogueBox.student.prompts", {
    returnObjects: true,
  }) as StudentPrompt[];

  // Find the "title" prompt which becomes "Which department or team" for students
  const studentTitlePrompt = studentPrompts?.find((p) => p.id === "title");

  return (
    <div>
      {/* Position Level */}
      <FormTabSelecor
        options={positionLevelOptions}
        value={formik.values.positionLevel}
        label={t("job-post-creator:form.positionLevel.label")}
        onChange={handlePositionLevelChange}
        fieldError={formik.errors.positionLevel}
        fieldTouched={formik.touched.positionLevel}
        hasErrorValidation={true}
      />
      {/* Job Title - dynamically changes to "Which department or team" for student template */}
      <div className="flex flex-col w-full">
        <FormLabel
          label={
            isStudentTemplate && studentTitlePrompt
              ? studentTitlePrompt.title
              : t("job-post-creator:form.jobTitle.label")
          }
          tooltipText={
            isStudentTemplate
              ? t("job-post-creator:form.departmentTeam.tooltip")
              : t("job-post-creator:form.jobTitle.tooltip")
          }
        />
        <FormTextarea
          value={formik.values.jobTitle}
          onChange={(e) => formik.setFieldValue("jobTitle", e.target.value)}
          placeholder={
            isStudentTemplate && studentTitlePrompt
              ? studentTitlePrompt.placeholder
              : t("job-post-creator:form.jobTitle.placeholder")
          }
          formTouched={formik.touched.jobTitle}
          formError={formik.errors.jobTitle}
        />
      </div>

      {/* Department and Team */}
      <div className="flex flex-col w-full">
        <FormLabel
          label={t("job-post-creator:form.departmentTeam.label")}
          tooltipText={t("job-post-creator:form.departmentTeam.tooltip")}
        />
        <FormTextarea
          value={formik.values.departmentTeam}
          onChange={(e) =>
            formik.setFieldValue("departmentTeam", e.target.value)
          }
          placeholder={t("job-post-creator:form.departmentTeam.placeholder")}
          formTouched={formik.touched.departmentTeam}
          formError={formik.errors.departmentTeam}
        />
      </div>

      {/* Job Scope */}
      <div className="flex flex-col w-full">
        <FormLabel
          label={t("job-post-creator:form.jobScope.label")}
          tooltipText={t("job-post-creator:form.jobScope.tooltip")}
        />
        <FormTextarea
          value={formik.values.jobScope}
          onChange={(e) => formik.setFieldValue("jobScope", e.target.value)}
          placeholder={t("job-post-creator:form.jobScope.placeholder")}
          formTouched={formik.touched.jobScope}
          formError={formik.errors.jobScope}
        />
      </div>

      {/* Qualifications */}
      <div className="flex flex-col w-full">
        <FormLabel
          label={t("job-post-creator:form.qualifications.label")}
          tooltipText={t("job-post-creator:form.qualifications.tooltip")}
        />
        <FormTextarea
          value={formik.values.qualifications}
          onChange={(e) =>
            formik.setFieldValue("qualifications", e.target.value)
          }
          placeholder={t("job-post-creator:form.qualifications.placeholder")}
          formTouched={formik.touched.qualifications}
          formError={formik.errors.qualifications}
        />
      </div>
      {/* Language */}
      <FormTabSelecor
        options={languageOptions}
        value={formik.values.language}
        label={t("job-post-creator:form.language.label")}
        onChange={handleLanguageChange}
        fieldError={formik.errors.language}
        fieldTouched={formik.touched.language}
        hasErrorValidation={true}
      />
    </div>
  );
};

export default JobPostCreatorFormItems;
