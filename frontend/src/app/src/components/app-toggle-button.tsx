import { motion } from "framer-motion";

type ToggleButtomProps = {
  dataTestId?: string;
  text: string;
  description?: string;
  isToggled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isModalToggle?: boolean;
  size?: "default" | "small"; // default keeps current size
  alignRight?: boolean; // default keeps toggle on the left
  provider?: string;
  status?: string;
  showStatus?: boolean;
};

const ToggleButton = ({
  dataTestId,
  text,
  description,
  isToggled,
  onToggle,
  disabled = false,
  isModalToggle,
  size = "default",
  alignRight = false,
  provider,
  status,
  showStatus = false, // Default to false
}: ToggleButtomProps) => {
  const handleClick = () => {
    if (!disabled) onToggle();
  };

  let backgroundClass = "";
  if (isToggled) {
    backgroundClass = "bg-gray-350";
  } else if (!disabled) {
    backgroundClass = isModalToggle ? "bg-gray-700" : "bg-gray-600";
  } else {
    backgroundClass = "bg-gray-500";
  }

  const trackSizeClasses = size === "small" ? "w-10 h-5" : "w-12 h-6";
  const knobSizeClasses = size === "small" ? "w-5 h-5" : "w-6 h-6";

  const ToggleTrack = (
    <div
      className={`relative inline-block ${trackSizeClasses} rounded-full transition-colors duration-300 mt-1 px-4 py-2 rounded ${backgroundClass} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      role="button"
      aria-label={text}
      onClick={handleClick}
      tabIndex={disabled ? -1 : 0}
      data-testid={dataTestId}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <motion.div
        className={`absolute top-0 left-0 ${knobSizeClasses} rounded-full shadow-2xl ${
          disabled ? "bg-gray-500" : isToggled ? "bg-white-100" : "bg-gray-400"
        }`}
        initial={false}
        animate={{ x: isToggled ? "100%" : "0%" }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
    </div>
  );

  return (
    <div className="flex flex-col w-full font-body">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3 items-center">
          <p
            className={`text-lg text-white-100 mr-1 ${disabled ? "opacity-50" : ""}`}
          >
            {text}
          </p>
          {/* Provider and Status (conditionally rendered) */}
          {provider && (
            <div className="text-white-100 text-sm capitalize bg-gray-600 border-2 border-gray-600 p-1  px-3 py-1 rounded-full">
              <span>{provider}</span>
            </div>
          )}
          {showStatus && isToggled && status && (
            <div
              className={`${!provider ? "text-white-100 border-gray-600 bg-gray-600" : "text-green-400 border-green-400"} border-2 text-sm px-3 py-1 rounded-full`}
            >
              <span>{status}</span>
            </div>
          )}
        </div>
        {ToggleTrack}
      </div>

      {/* Description beneath, full width */}
      {description && (
        <p className={`text-gray-300 mt-2 ${disabled ? "opacity-50" : ""}`}>
          {description}
        </p>
      )}
    </div>
  );
};

export default ToggleButton;
