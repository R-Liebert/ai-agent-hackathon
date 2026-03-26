import React, { ChangeEvent, useState, useEffect } from "react";
import {
  FormControl,
  MenuItem,
  TextField,
  CircularProgress,
} from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useTranslation } from "react-i18next";
import { FiChevronDown } from "react-icons/fi";
import { motion } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";

interface FeedbackFormInputProps {
  handleSendFeedback: (feedback: FeedbackState) => void;
  onClose: () => void;
  isLoading: boolean;
}

export interface FeedbackState {
  feedbackType: string;
  message: string;
}

export const FeedbackForm = (props: FeedbackFormInputProps) => {
  const messageMaxLenght = 1500;
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useTranslation();

  const validationSchema = Yup.object().shape({
    message: Yup.string()
      .min(1, t("components:feedbackComponent.form.provideFeedbackMessage"))
      .max(
        messageMaxLenght,
        t("components:feedbackComponent.form.feedbackMessageTooLong")
      )
      .required(t("components:feedbackComponent.form.provideFeedbackMessage")),
    feedbackType: Yup.string().required(
      t("components:feedbackComponent.form.provideFeedbackType")
    ),
  });

  const formik = useFormik<FeedbackState>({
    initialValues: {
      feedbackType: "Feature Requests",
      message: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      props.handleSendFeedback({
        message: values.message,
        feedbackType: values.feedbackType,
      } as FeedbackState);
    },
  });

  const handleFeedbackTypeChange = (event: SelectChangeEvent) => {
    formik.setFieldValue("feedbackType", event.target.value as string);
  };

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value: string = event.target.value;
    if (value.length <= messageMaxLenght) {
      formik.setFieldValue("message", value);
    }
  };

  const handleSendFeedbackIntl = () => {
    if (formik.isValid) {
      formik.submitForm();
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 mt-4">
        <FormControl fullWidth>
          <Select
            className="relative z-index-10 !rounded-xl !cursor-pointer !text-white-100 !font-body !text-sm !outline-none !bg-transparent"
            sx={{
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#3A3A3D !important",
                borderWidth: "1.8px !important",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#DEDEDE !important",
                borderWidth: "1.8px !important",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#DEDEDE !important",
                borderWidth: "1.8px !important",
              },
            }}
            labelId="feedback-select-label"
            value={formik.values.feedbackType}
            onChange={handleFeedbackTypeChange}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            IconComponent={() => (
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute right-4 top-1/3 transform -translate-y-1/2 pointer-events-none z-index-1"
              >
                <FiChevronDown
                  className="text-white-100 text-xl ml-auto"
                  strokeWidth={2}
                />
              </motion.div>
            )}
            MenuProps={{
              PaperProps: {
                className:
                  "!bg-gray-700 border-2 !py-1 !border-gray-500 mt-2 flex flex-col !shadow-dropdown !rounded-xl !text-white-100 !text-sm",
                sx: {
                  "& .MuiMenuItem-root": {
                    backgroundColor: "transparent",
                    fontSize: "14px!important",
                    "&:hover": {
                      backgroundColor: "#424242 !important",
                    },
                  },
                  "& .MuiMenuItem-root:hover": {
                    backgroundColor: "#424242",
                  },
                  "& .MuiMenuItem-root.Mui-selected": {
                    backgroundColor: "#424242",
                  },
                },
              },
              MenuListProps: {
                className: "bg-gray-700 text-white-100 rounded-lg !text-sm",
              },
            }}
          >
            <MenuItem
              value="Feature Requests"
              className="!w-full !py-3 !font-body !mb-2 !text-sm"
            >
              {t("components:feedbackForm.feedbackList.option1")}
            </MenuItem>
            <MenuItem
              value="Bugs Incidents"
              className="!w-full !py-3 !font-body !text-sm"
            >
              {t("components:feedbackForm.feedbackList.option2")}
            </MenuItem>
          </Select>
          <div className="!font-body text-gray-300 text-xs mt-2 text-red-500">
            {formik.errors.feedbackType}
          </div>
        </FormControl>
        <div>
          <TextField
            className="!font-body"
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#DEDEDE !important",
                "& fieldset": {
                  borderColor: "#3A3A3D !important",
                  borderWidth: "1.8px !important",
                  borderRadius: "14px",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#DEDEDE !important",
                  borderWidth: "1.8px !important",
                },
                fontFamily: "'Nunito Sans', sans-serif!important",
              },
              "& .MuiInputLabel-root": {
                color: "#89898E",
                fontFamily: "'Nunito Sans', sans-serif!important",
                fontSize: "14px",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#DEDEDE !important",
                fontSize: "18px!important",
                backgroundColor: "#2F2F2F!important",
                paddingRight: "8px!important",
              },
            }}
            id="outlined-multiline-flexible"
            label={t("components:feedbackForm.feedbackMessage.label")}
            multiline
            value={formik.values.message}
            fullWidth
            rows={5}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              handleMessageChange(event)
            }
          />
          <div className="!font-body text-gray-300 text-xs mt-2">
            {formik.values.message.length}/{messageMaxLenght}
          </div>
          <div className="!font-body text-gray-300 text-xs mt-2 text-red-500">
            {formik.errors.message}
          </div>
        </div>
      </div>
      <div className="flex w-full justify-end pb-6 ml-auto gap-3 mt-10">
        <button
          aria-label={t("components:feedbackComponent.buttons.cancel")}
          className="flex place-content-center rounded-full px-6 py-3 bg-gray-400 text-white-100 hover:bg-gray-650 hover:text-white-100
                focus:bg-gray-650 focus:text-white-100 font-body transition-color transition-background duration-300 ease-in-out place-items-center"
          onClick={props.onClose}
        >
          {t("components:feedbackComponent.buttons.cancel")}
        </button>
        <button
          aria-label={t("components:feedbackComponent.buttons.send")}
          className="flex place-content-center rounded-full px-6 py-3 bg-white-200 hover:bg-red-700 hover:text-white-100 font-body text-gray-600 font-semibold transition-color transition-background duration-300 ease-in-out place-items-center place-content-center disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSendFeedbackIntl}
          disabled={props.isLoading}
        >
          {t("components:feedbackComponent.buttons.send")}
          {props.isLoading && (
            <CircularProgress
              size={20}
              sx={{ color: "inherit", marginLeft: "8px" }}
            />
          )}
        </button>
      </div>
    </>
  );
};
