import { useEffect, useState } from "react";

const useUserInputDetection = () => {
  const [hasUserInput, setHasUserInput] = useState(false);

  useEffect(() => {
    const handleInput = (event: Event) => {
      const target = event.target;

      if (target instanceof HTMLInputElement) {
        // Check for text input
        if (target.type === "text" && target.value.trim()) {
          setHasUserInput(true);
        }

        // Check for file input
        if (target.type === "file" && target.files && target.files.length > 0) {
          setHasUserInput(true);
        }
      } else if (target instanceof HTMLTextAreaElement) {
        // Check for textarea input
        if (target.value.trim()) {
          setHasUserInput(true);
        }
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        setHasUserInput(true);
      }
    };

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleInput);

    document.addEventListener("dragover", preventDefault);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("input", handleInput);
      document.removeEventListener("change", handleInput);
      document.removeEventListener("dragover", preventDefault);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  return hasUserInput;
};

export default useUserInputDetection;
