import React, { useRef, useEffect } from "react";
import FormFieldValidationMessage from "../../components/Global/FormFieldValidationMessage";

interface FormTextareaProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  maxLength?: number;
  formTouched?: boolean;
  formError?: string;
  isSubscriptionElement?: boolean;
  size?: "sm" | "md";
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength = 1500,
  formTouched,
  formError,
  isSubscriptionElement = false,
  size = "md",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Adjust the height dynamically
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    onChange(e);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      requestAnimationFrame(() => {
        const lineHeight = parseInt(
          window.getComputedStyle(textarea).lineHeight || "20",
          10,
        );
        const placeholderHeight = calculatePlaceholderHeight(
          textarea,
          placeholder,
        );
        const calculatedRows = Math.ceil(placeholderHeight / lineHeight);
        const rows = Math.max(calculatedRows, 1);
        textarea.rows = rows;
      });
    }
  }, [placeholder]);

  const calculatePlaceholderHeight = (
    textarea: HTMLTextAreaElement,
    text: string,
  ) => {
    const computedStyle = window.getComputedStyle(textarea);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;

    const textWidth =
      textarea.offsetWidth -
      paddingLeft -
      paddingRight -
      borderLeft -
      borderRight;

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    tempDiv.style.whiteSpace = "pre-wrap";
    tempDiv.style.wordWrap = "break-word";
    tempDiv.style.width = `${Math.max(textWidth, 100)}px`;
    tempDiv.style.font = computedStyle.font;
    tempDiv.textContent = text;
    document.body.appendChild(tempDiv);
    const height = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);
    return height;
  };

  const textSizeClass =
    size === "sm"
      ? "text-sm placeholder:!text-sm !bg-gray-900/60 !border-gray-600"
      : "text-md";

  return (
    <div className="flex flex-col w-full">
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={handleInput}
        onBlur={onBlur}
        maxLength={maxLength}
        className={`w-full ${
          isSubscriptionElement
            ? "bg-gray-700 sm:bg-gray-650 border-gray-500 sm:border-transparent py-3 px-4"
            : "border-gray-500 bg-transparent p-4"
        } border-2 rounded-xl font-body ${textSizeClass} text-white-100 outline-none resize-none focus:border-white-100 focus:outline-none placeholder-gray-300`}
        placeholder={placeholder}
        style={{ overflow: "hidden" }}
      />

      {formTouched && formError && (
        <FormFieldValidationMessage
          formTouched={formTouched}
          formError={formError}
        />
      )}
    </div>
  );
};

export default FormTextarea;
