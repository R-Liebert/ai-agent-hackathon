import React from "react";
import Accordion from "../../components/Global/AccordionForm";
import { useTranslation } from "react-i18next";
import {
  TbListSearch,
  TbPencilStar,
  TbDownload,
  TbBookUpload,
} from "react-icons/tb";

const JobPostCreatorInstructions: React.FC = ({}) => {
  const { t } = useTranslation();

  // Helper that ensures the translation is always returned as an array
  const getArrayFromTranslation = (key: string) => {
    const translatedValue = t(key, { returnObjects: true });
    return Array.isArray(translatedValue) ? translatedValue : [translatedValue];
  };

  const formDescription = getArrayFromTranslation(
    "job-post-creator:instructions.accordion.form.description"
  );
  const editDescription = getArrayFromTranslation(
    "job-post-creator:instructions.accordion.edit.description"
  );

  // Return conditional UI
  return (
    <div className="w-full md:w-[45%] mt-0 sm:mt-9 pb-[4rem] md:pb-[1rem] h-auto">
      <div className="w-full">
        <div className="flex flex-col w-full">
          <h2 className="xxl:text-[24px] lg:text-[20px] text-[22px] font-medium pb-4 w-full">
            {t("job-post-creator:instructions.title")}
          </h2>
          <div className="text-gray-300 text-md xxl:mt-0 mt-4">
            {t("job-post-creator:instructions.description")}
          </div>
        </div>

        <div className="flex flex-col mb-12">
          {/* FORM ACCORDION */}
          <Accordion
            label={t("job-post-creator:instructions.accordion.form.title")}
            icon={<TbListSearch size={28} strokeWidth={1.2} />}
          >
            <ul className="py-4 w-full flex flex-col list-disc pl-4 gap-1">
              {formDescription.map((item, index) => (
                <li key={index}>
                  <p dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </Accordion>

          {/* EDIT ACCORDION */}
          <Accordion
            label={t("job-post-creator:instructions.accordion.edit.title")}
            icon={<TbPencilStar size={28} strokeWidth={1.2} />}
          >
            <ul className="py-4 w-full flex flex-col list-disc pl-4 gap-1">
              {editDescription.map((item, index) => (
                <li key={index}>
                  <p dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </Accordion>

          {/* COLLABORATION ACCORDION */}
          <Accordion
            label={t(
              "job-post-creator:instructions.accordion.collaboration.title"
            )}
            icon={<TbDownload size={28} strokeWidth={1.2} />}
          >
            <div className="py-4 w-full">
              {t(
                "job-post-creator:instructions.accordion.collaboration.description"
              )}
            </div>
          </Accordion>

          {/* EVALUATION ACCORDION */}
          <Accordion
            label={t(
              "job-post-creator:instructions.accordion.evaluation.title"
            )}
            icon={<TbBookUpload size={28} strokeWidth={1.2} />}
          >
            <div className="py-4 w-full">
              {t(
                "job-post-creator:instructions.accordion.evaluation.description"
              )}
            </div>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default JobPostCreatorInstructions;
