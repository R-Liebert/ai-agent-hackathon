import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Survey, SurveyAnswer } from "../../models/survey-model";
import { surveysService } from "../../services/surveysService";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface SurveysContextType {
  activeSurvey: Survey | null | undefined;
  isLoading: boolean;
  onClose: (survey: Survey) => void;
  onConfirm: (survey: Survey) => void;
  onRemindme: (survey: Survey) => void;
}

const SurveysContext = createContext<SurveysContextType | undefined>(undefined);

export const useSurveys = (): SurveysContextType => {
  const context = useContext(SurveysContext);
  if (!context) {
    throw new Error("useSurveys must be used within a SurveysProvider");
  }
  return context;
};

interface SurveysProviderProps {
  children: ReactNode;
}

export const SurveysProvider: React.FC<SurveysProviderProps> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);

  const location = useLocation();

  const { data: activeSurveys } = useQuery<Survey[]>({
    queryKey: ["active-surveys"],
    queryFn: surveysService.loadSurveys,
    staleTime: 1 * 24 * 60 * 60 * 1000, // 1 day
  });

  const getUserAnswer = useCallback((survey: Survey) => {
    const item = sessionStorage.getItem(`survey-answers-${survey.id}`);
    if (item != null) {
      const answer = JSON.parse(item) as SurveyAnswer;
      if (answer) {
        try {
          const answeredOnDate = new Date(answer.answeredOn);

          const now = new Date();
          const differenceInMs = now.getTime() - answeredOnDate.getTime();
          const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

          if (differenceInDays > 1) {
            // More than 1 day has passed -> ask again.
            return null;
          } else {
            // Less than 1 day has passed
            return answer;
          }
        } catch {}
      }
    }
    return null;
  }, []);

  const setUserAnswer = async (survey: Survey, answer: string) => {
    try {
      const activeSurveys = await surveysService.saveSurveyAnswer(
        survey.id,
        answer
      );

      const surveyAnswer: SurveyAnswer = {
        surveyId: survey.id,
        answerType: answer,
        answeredOn: new Date(),
      };

      sessionStorage.setItem(
        `survey-answers-${survey.id}`,
        JSON.stringify(surveyAnswer)
      );

      return activeSurveys;
    } catch (err) {
      console.error(err);
    }
  };

  const onConfirm = async (selectedSurvey: Survey) => {
    try {
      setIsLoading(true);
      var win = window.open(selectedSurvey.link, "_blank");
      win?.focus();
      await setUserAnswer(selectedSurvey, "Yes");
    } catch (error) {
      console.error(error);
    } finally {
      setActiveSurvey(null);
      setIsLoading(false);
    }
  };

  const onClose = async (selectedSurvey: Survey) => {
    try {
      setIsLoading(true);
      await setUserAnswer(selectedSurvey, "No");
    } catch (error) {
      console.error(error);
    } finally {
      setActiveSurvey(null);
      setIsLoading(false);
    }
  };

  const onRemindme = async (selectedSurvey: Survey) => {
    try {
      setIsLoading(true);
      await setUserAnswer(selectedSurvey, "Remindme");
    } catch (error) {
      console.error(error);
    } finally {
      setActiveSurvey(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async function () {
      if (activeSurveys == null) {
        setActiveSurvey(null);
        return;
      }

      let activeSurvey: Survey | undefined | null = null;

      if (activeSurveys && activeSurveys?.length > 0) {
        const pathname = location.pathname;
        activeSurvey = activeSurveys.find((x) => x.path == pathname);
      }

      if (activeSurvey == undefined || activeSurvey == null) {
        setActiveSurvey(null);
        return;
      }

      const surveyAnswer: SurveyAnswer | null = getUserAnswer(activeSurvey);
      if (surveyAnswer != null) {
        setActiveSurvey(null);
        return;
      }

      setActiveSurvey(activeSurvey);
    })();
  }, [location, activeSurveys, getUserAnswer]);

  return (
    <SurveysContext.Provider
      value={{ activeSurvey, isLoading, onClose, onConfirm, onRemindme }}
    >
      {children}
    </SurveysContext.Provider>
  );
};
