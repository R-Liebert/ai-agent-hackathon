import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TbCalendarClock } from "react-icons/tb";
import { FiX } from "react-icons/fi";

interface Window {
  showGlobalModal?: () => void;
  hideGlobalModal?: () => void;
}

const SystemMaintenanceModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const showModal = () => {
    setIsVisible(true);
  };

  const hideModal = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    (window as any).showGlobalModal = showModal;
    (window as any).hideGlobalModal = hideModal;

    return () => {
      (window as any).showGlobalModal = null;
      (window as any).hideGlobalModal = null;
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-2 right-2 bg-red-500 text-white rounded-2xl max-w-md w-full z-[9999] border-2 border-red-300"
          initial={{ opacity: 0, x: 50, y: 50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, y: 50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between place-items-center p-4 border-b-2 border-red-300 text-white-100">
            <h2 className="text-lg font-semibold m-0 p-0">
              Scheduled System Update
            </h2>
            <button
              onClick={hideModal}
              className="text-white-100 text-2xl font-bold focus:outline-none flex place-self-center text-center"
            >
              <FiX />
            </button>
          </div>
          <div className="flex p-4 pb-2 place-items-center">
            <div className="flex rounded-full bg-white-100 place-items-center place-content-center h-12 w-12 mr-4 text-red-500">
              <TbCalendarClock size={26} />
            </div>
            <p className="text-md w-[55%] font-semibold">
              Tuesday, 17th September 2024, between 16:30 and 18:30
            </p>
          </div>

          <div className="flex flex-col p-4 gap-6 text-white-100/80">
            <p className="text-md w-full">
              We will be conducting a system update. During this time, the
              Launchpad tool may experience instability or downtime. We
              apologize for any inconvenience caused and appreciate your
              understanding.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SystemMaintenanceModal;
