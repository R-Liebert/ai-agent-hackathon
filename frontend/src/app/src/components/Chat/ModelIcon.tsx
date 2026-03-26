import React from "react";
import {
  HiOutlineSparkles,
  HiOutlineRocketLaunch,
  HiOutlineBolt,
  HiOutlineLightBulb,
  HiOutlineChatBubbleBottomCenterText,
} from "react-icons/hi2";
import { RiRobot2Line } from "react-icons/ri";
import { ModelIconType } from "../../models/models-config";

interface ModelIconProps {
  iconType: ModelIconType;
  className?: string;
}

const ModelIcon: React.FC<ModelIconProps> = ({
  iconType,
  className = "text-white-100 text-xl",
}) => {
  switch (iconType) {
    case "bolt":
      return <HiOutlineBolt className={className} />;
    case "sparkles":
      return <HiOutlineSparkles className={className} />;
    case "robot":
      return <RiRobot2Line className={className} />;
    case "rocket":
      return <HiOutlineRocketLaunch className={className} />;
    case "lightbulb":
      return <HiOutlineLightBulb className={className} />;
    case "chatBubble":
    default:
      return <HiOutlineChatBubbleBottomCenterText className={className} />;
  }
};

export default ModelIcon;
