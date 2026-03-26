import React from "react";
import { useTranslation } from "react-i18next";
import FormTabSelecor from "../../components/Global/FormTabSelector";
import { TbStar, TbStarFilled } from "react-icons/tb";
import FormLabel from "../../components/Global/FormLabel";
import FormTextarea from "../../components/Global/FormTextarea";

interface ApplicationRatingFormProps {
  impactLevelOptions: { value: string; label: string }[];
  formik: any;
  handleImpactLevelChange: (value: string) => void;
  handleTimeSavingChange: (value: string) => void;
  timeSavingOptions: { value: string; label: string }[];
  handleRatingChange: (value: string) => void;
  ratingOptions: { value: string; label: string }[];
  handleJobSatisfactionChange: (value: string) => void;
  jobSatisfactionOptions: { value: string; label: string }[];
}

const ApplicationRatingForm: React.FC<ApplicationRatingFormProps> = ({
  formik,
  impactLevelOptions,
  handleImpactLevelChange,
  handleTimeSavingChange,
  timeSavingOptions,
  handleRatingChange,
  ratingOptions,
  handleJobSatisfactionChange,
  jobSatisfactionOptions,
}) => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col w-full">
      {/* Application Rating starRating */}
      <FormTabSelecor
        options={ratingOptions}
        value={formik.values.applicationRating.starRating}
        label={t("feedback:forms.applicationRatingForm.starRating.label")}
        tooltipText={t(
          "feedback:forms.applicationRatingForm.starRating.tooltip"
        )}
        onChange={handleRatingChange}
        renderOption={(option, selectedValue) => (
          <div
            className={`flex gap-1 items-center justify-center py-1 ${
              Number(option.value) === 1 ? "px-0 lg:px-3" : "px-0 lg:px-4"
            }`}
          >
            {Array.from({ length: Number(option.value) }, (_, index) => {
              const starValue = index + 1;
              return option.value === selectedValue ? (
                <TbStarFilled
                  key={starValue}
                  size={20}
                  strokeWidth={1.8}
                  className="text-white-100"
                />
              ) : (
                <TbStar
                  key={starValue}
                  size={20}
                  strokeWidth={1.8}
                  className="text-white-100"
                />
              );
            })}
          </div>
        )}
        hasErrorValidation={true}
        fieldTouched={formik.touched.applicationRating?.starRating}
        fieldError={formik.errors.applicationRating?.starRating}
      />

      {/* Time Saving */}
      <FormTabSelecor
        options={timeSavingOptions}
        value={formik.values.applicationRating.timeSavingData}
        label={t("feedback:forms.applicationRatingForm.timeSavingData.label")}
        onChange={handleTimeSavingChange}
        hasErrorValidation={true}
        fieldTouched={formik.touched.applicationRating?.timeSavingData}
        fieldError={formik.errors.applicationRating?.timeSavingData}
      />

      {/* Impact Rating */}
      <FormTabSelecor
        options={impactLevelOptions}
        value={formik.values.applicationRating.workQualityImpact}
        label={t(
          "feedback:forms.applicationRatingForm.workQualityImpact.label"
        )}
        onChange={handleImpactLevelChange}
        hasErrorValidation={true}
        fieldTouched={formik.touched.applicationRating?.workQualityImpact}
        fieldError={formik.errors.applicationRating?.workQualityImpact}
      />

      {/* Job Satisfaction */}
      <div className="flex flex-col w-full mt-2">
        <FormTabSelecor
          options={jobSatisfactionOptions}
          value={formik.values.applicationRating.jobSatisfaction}
          label={t(
            "feedback:forms.applicationRatingForm.jobSatisfaction.label"
          )}
          onChange={handleJobSatisfactionChange}
          hasErrorValidation={true}
          fieldTouched={formik.touched.applicationRating?.jobSatisfaction}
          fieldError={formik.errors.applicationRating?.jobSatisfaction}
        />
      </div>

      {/* Use Case Scenarios */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t(
            "feedback:forms.applicationRatingForm.useCaseScenario.label"
          )}
          tooltipText={t(
            "feedback:forms.applicationRatingForm.useCaseScenario.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.applicationRating.useCaseScenario}
          onChange={(e) =>
            formik.setFieldValue(
              "applicationRating.useCaseScenario",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms.applicationRatingForm.useCaseScenario.placeholder"
          )}
          formTouched={formik.touched.applicationRating?.useCaseScenario}
          formError={formik.errors.applicationRating?.useCaseScenario}
        />
      </div>

      {/* Other AI tools */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t(
            "feedback:forms.applicationRatingForm.otherAiToolsUsed.label"
          )}
        />
        <FormTextarea
          value={formik.values.applicationRating.otherAiToolsUsed}
          onChange={(e) =>
            formik.setFieldValue(
              "applicationRating.otherAiToolsUsed",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms.applicationRatingForm.otherAiToolsUsed.placeholder"
          )}
        />
      </div>

      {/* Features Missing - other tools comparison */}
      <div className="flex flex-col w-full mt-2">
        <FormLabel
          label={t(
            "feedback:forms.applicationRatingForm.missingFeatureIndication.label"
          )}
          tooltipText={t(
            "feedback:forms.applicationRatingForm.missingFeatureIndication.tooltip"
          )}
        />
        <FormTextarea
          value={formik.values.applicationRating.missingFeatureIndication}
          onChange={(e) =>
            formik.setFieldValue(
              "applicationRating.missingFeatureIndication",
              e.target.value
            )
          }
          placeholder={t(
            "feedback:forms.applicationRatingForm.missingFeatureIndication.placeholder"
          )}
        />
      </div>
    </section>
  );
};

export default ApplicationRatingForm;
