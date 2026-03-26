import React from "react";
import { ChatMessage } from "../../models/chat-message";
import { useCanvas } from "../../hooks/useCanvas";

interface JobPostGeneratedProps {
  dialogue: ChatMessage[];
}

const JobPostGenerated: React.FC<JobPostGeneratedProps> = ({ dialogue }) => {
  const { canvasTitle } = useCanvas();
  return (
    <section className="flex flex-col w-[90%] md:w-full mx-auto lg:mx-0 max-w-[38rem] lg:max-w-none lg:w-[47%] mt-0 md:mt-9 pb-[6rem] gap-4 font-body">
      <h2 className="xxl:text-[24px] lg:text-[20px] text-[22px] font-medium pb-4 w-full lg:w-[65%] capitalize x-full">
        {canvasTitle}
      </h2>
      {Array.isArray(dialogue) &&
        dialogue.map((item, index) => (
          <div className="flex flex-col gap-1" key={index}>
            <h3 className="text-[16px] font-semibold select-none leading-norma">
              {item.header}
            </h3>
            <p
              className="whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        ))}
    </section>
  );
};

export default JobPostGenerated;
