import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti-boom";

const ConfettiComponent: React.FC = () => {
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (confettiVisible) {
      timer = setTimeout(() => {
        setConfettiVisible(false);
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, [confettiVisible]);

  const triggerConfetti = () => {
    setConfettiVisible(true);
  };

  return (
    <>
      <AnimatePresence>
        {confettiVisible && (
          <motion.div
            className="fixed -top-12 left-0 w-full h-full pointer-events-none overflow-hidden"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 6, ease: [0.4, 0, 0.2, 1] }}
          >
            <Confetti
              mode="fall"
              particleCount={220}
              shapeSize={16}
              colors={[
                "#18AD9B",
                "#13717A",
                "#557CA9",
                "#6138DB",
                "#EC4558",
                "#C45CC0",
                "#3782E1",
                "#E07058",
                "#DDA044",
                "#B41730",
                "#023152",
                "#044D81",
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConfettiComponent;
