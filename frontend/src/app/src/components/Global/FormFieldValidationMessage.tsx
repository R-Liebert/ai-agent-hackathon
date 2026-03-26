import React from "react";

interface FormFieldValidationMessageProps {
  formTouched: any;
  formError: any;
}

const FormFieldValidationMessage: React.FC<FormFieldValidationMessageProps> = ({
  formTouched,
  formError,
}) => {
  const isTouched = formTouched;
  const error = formError;

  if (!isTouched || !error) return null; // Don't render anything if not touched or no error

  return <p className="text-red-400 mt-1 text-sm font-body">{error}</p>;
};

export default FormFieldValidationMessage;
