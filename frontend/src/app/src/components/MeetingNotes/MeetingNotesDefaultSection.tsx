import React from "react";
import { useTranslation } from "react-i18next";
import DefaultContent from "../Global/AppDefault";
import Heading from "../Global/AppHeading";
import { IconType } from "react-icons";

interface MeetingNotesDefaultProps {
  handleUpload: () => void;
  Icon?: IconType;
}

const MeetingNotesDefaultSection: React.FC<MeetingNotesDefaultProps> = ({
  handleUpload,
  Icon,
}) => {
  const { t } = useTranslation();

  return (
    <section>
      <Heading
        titleKey="meeting-note-generator:moduleName"
        taglineKey="meeting-note-generator:menuAppBar.tagline"
      />
      <DefaultContent
        placeholderText={t("meeting-note-generator:defaultContent.placeholder")}
        moduleName={t("meeting-note-generator:moduleName")}
        Icon={Icon}
        iconSize={40}
        colorCode="bg-app-meetingNotes"
        textWidth="xxxl:w-[53%] sm:w-[63%] w-[90%]"
        handleAction={handleUpload}
      >
        <button
          onClick={handleUpload}
          aria-label={t("meeting-note-generator:defaultContent.selectButton")}
          className="rounded-full w-full bg-white-200 text-gray-700 !font-body py-4 font-semibold flex items-center justify-center hover:bg-red-600 hover:text-white-100 transition-color duration-300 ease-out"
        >
          {t("meeting-note-generator:defaultContent.selectButton")}
        </button>
      </DefaultContent>
    </section>
  );
};

export default MeetingNotesDefaultSection;
