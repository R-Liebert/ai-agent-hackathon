import React, { useEffect, useState } from "react";
import GrammarIcon from "@mui/icons-material/TextFields";
import SummarizeIcon from "@mui/icons-material/Summarize";
import ParseIcon from "@mui/icons-material/Code";
import EmojiIcon from "@mui/icons-material/EmojiEmotions";
import KeywordsIcon from "@mui/icons-material/Label";
import GradingIcon from "@mui/icons-material/Grading";
import DirectionsIcon from "@mui/icons-material/Directions";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import "./MenuPage.css";
import { useNavigate } from "react-router-dom";
import { Config } from "../../interfaces/interfaces";
import { useTranslation } from "react-i18next";
import MainNav from "../../components/MainNavigation/MainNavigation";
import FeatureTile from "../../components/FeatureTile";
import {
  useIsLeader,
  useCanUseTrafficInformation,
  usePermissions,
} from "../../contexts/AuthProvider";
import { useMsal } from "@azure/msal-react";
import { IoLayers, IoLibrary } from "react-icons/io5";
import { HiMiniUserGroup, HiMiniNewspaper } from "react-icons/hi2";
import { TbBrain } from "react-icons/tb";
import ChatBotIcon from "@mui/icons-material/Chat";
import VideoList from "../../components/Videos/VideosList";
import Countdown, { CountdownRenderProps } from "react-countdown";
import { Helmet } from "react-helmet-async";
import GlobalContainer from "../../components/Global/AppContainer";
import { BsFileTextFill } from "react-icons/bs";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";
import useSidebarStore from "../../stores/navigationStore";

const config: Config = window.env;

type IconType = {
  [key: string]: JSX.Element;
};

type IconDataItem = {
  id: number;
  iconKey: string;
  link: string;
  title: string;
  description: string;
  color: string;
  isExternalLink?: boolean;
  releaseDate?: string;
  isHero?: boolean;
};

function MenuPage() {
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isLeader = useIsLeader();
  const canUseTrafficInformation = useCanUseTrafficInformation();
  const { isLoadingPermissions } = usePermissions();
  const { isSidebarOpen } = useSidebarStore();
  const { accounts } = useMsal();

  const countdownRenderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: CountdownRenderProps) => {
    if (completed) {
      return null;
    } else {
      return (
        <div className="text-white text-center">
          <p className="text-md">Coming Soon!</p>
          <p className="text-md">
            {days}d {hours}h {minutes}m {seconds}s
          </p>
        </div>
      );
    }
  };

  const icons: IconType = {
    grammar: <GrammarIcon />,
    summarize: <SummarizeIcon />,
    parse: <ParseIcon />,
    emoji: <EmojiIcon />,
    accountIcon: <HiMiniUserGroup size="32" />,
    libraryIcon: <IoLibrary size="26" />,
    newsIcon: <HiMiniNewspaper size="26" />,
    brainIcon: <TbBrain size="26" />,
    gradingIcon: <GradingIcon />,
    keywords: <KeywordsIcon />,
    editNote: <HiMiniNewspaper size="28" />,
    chatBot: <ChatBotIcon />,
    directions: <DirectionsIcon />,
    docuScan: <DocumentScannerIcon />,
    workspaces: <IoLayers size="26" />,
    aiTrafficInformation: <BsFileTextFill size="24" />,
    agentIcon: (
      <img
        src="https://res.cloudinary.com/your-cloudinary-account/image/upload/v123456789/patchy-agent-icon.png"
        alt="Patchy AI Agent"
        style={{ width: "32px", height: "32px", objectFit: "contain" }}
      />
    ),
  };

  useEffect(() => {
    // Icons are loaded when permissions are loaded
    setIconsLoaded(!isLoadingPermissions);
  }, [isLoadingPermissions]);

  const iconDataOrig: IconDataItem[] = [
    {
      id: 1,
      iconKey: "chatBot",
      link: "dsb-chat",
      title: "DSB Chat",
      description: "Let your imagination run wild",
      color: "#18AD9B",
      isHero: true,
    },
    {
      id: 2,
      iconKey: "workspaces",
      link: "workspaces",
      title: "Workspaces",
      description: "Access all your AI spaces",
      color: "#557CA9",
      releaseDate: "2023-10-17T09:00:00",
      isHero: true,
    },
    {
      id: 12,
      iconKey: "accountIcon",
      link: "job-post-creator",
      title: "Job Post Creator",
      description: "Create job posts using AI",
      color: "#8856BB",
    },
    {
      id: 7,
      iconKey: "docuScan",
      link: "docuscan",
      title: "Document Converter",
      description:
        "Turn your images or unreadable text into readable pdf documents.",
      color: "#E07058",
    },
    {
      id: 8,
      iconKey: "editNote",
      link: "meeting-note-generator",
      title: "Meeting Notes Creator",
      description: "Summarize meetings using transcripts",
      color: "#DDA044",
    },
    ...(isLeader
      ? [
          {
            id: 9,
            iconKey: "chatBot",
            link: "leader-chat",
            title: "Leader Chat",
            description: "Ask about HR-related topics",
            color: "#FF69B4",
          },
        ]
      : []),
    ...(canUseTrafficInformation
      ? [
          {
            id: 11,
            iconKey: "aiTrafficInformation",
            link: "ai-traffic-information",
            title: "AI Traffic Information",
            description: "Generate different platform outputs",
            color: "#13717A",
          },
        ]
      : []),
    {
      id: 12,
      iconKey: "agentIcon",
      link: "localhost:5173",
      title: "Patchy - AI Agent",
      description: "Always patching problems",
      color: "#8856BB",
    },
  ].filter((item) => item !== null);

  const iconDataTranslationsObj: Record<string, any> = t("menu-page:apps", {
    returnObjects: true,
  });

  const iconDataTranslations: any[] = Array.isArray(iconDataTranslationsObj)
    ? iconDataTranslationsObj
    : Object.values(iconDataTranslationsObj);

  const iconData: IconDataItem[] = iconDataOrig.map((item) => {
    const transItem = iconDataTranslations.find((x) => x.id === item.id);
    return transItem ? Object.assign({}, item, transItem) : item;
  });

  const CHAT_INTEGRATIONS: Record<string, string> = {
    "meeting-note-generator": "meeting-notes",
    docuscan: "doc-converter",
  };

  const filteredIconItems = iconData.map((item, index) => {
    const releaseDate = item.releaseDate ? new Date(item.releaseDate) : null;
    const now = new Date();
    const isReleased = !releaseDate || releaseDate <= now;

    const handleClick = () => {
      if (!isReleased) return;

      if (item.link === "dsb-chat") {
        const chatSource = CHAT_INTEGRATIONS[item.link];
        if (chatSource) {
          navigate(`/dsb-chat?source=${chatSource}`);
          return;
        }
        navigate(`/${item.link}`);
      }
      // Everything else is static/does nothing
    };

    return (
      <div
        key={item.id}
        className={`relative h-full ${item.isHero ? "feature-grid__hero" : "feature-grid__standard"}`}
      >
        <FeatureTile
          icon={icons[item.iconKey]}
          title={item.title}
          description={item.description}
          color={item.color}
          isHero={item.isHero}
          onClick={handleClick}
          index={index}
        />
        {!isReleased && (
          <div className="absolute rounded-2xl inset-0 bg-stone-950 bg-opacity-75 flex items-center justify-center z-10">
            <Countdown date={releaseDate} renderer={countdownRenderer} />
          </div>
        )}
      </div>
    );
  });

  return (
    <>
      <Helmet>
        <title>DSB AI Launchpad</title>
        <meta name="description" content="DSB AI Launchpad applications" />
      </Helmet>
      <MainNav title={"Launchpad Applications"} />
      <PageTransitionContainer>
        <GlobalContainer>
          <div
            id="menu-page"
            className="max-w-xl lg:max-w-5xl mx-auto flex flex-col tracking-normal px-4 sm:px-6 lg:px-8 relative"
          >
            <div className="text-center flex flex-col items-center mt-[3.5em] sm:mt-[3em] lg:mt-[4em] xxl:mt-[5em] xxxl:mt-[8em]">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl text-white-100 font-headers font-bold">
                {t("menu-page:textTitle")}
              </h1>
              <p className="text-gray-300 mt-2 font-body text-sm sm:text-lg w-[90%]">
                {t("menu-page:textTagline")}
              </p>
              <div className="mt-5 h-[3px]" aria-hidden="true" />
            </div>

            {iconsLoaded && (
              <div className="feature-grid">{filteredIconItems}</div>
            )}
            <VideoList />
          </div>
        </GlobalContainer>
      </PageTransitionContainer>
    </>
  );
}

export default MenuPage;
