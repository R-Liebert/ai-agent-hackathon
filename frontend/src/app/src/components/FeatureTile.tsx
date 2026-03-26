import React, { useCallback } from "react";
import { motion } from "framer-motion";
import "./FeatureTile.css";

interface FeatureTileProps {
  title: string;
  description: string;
  icon: JSX.Element;
  color: string;
  isHero?: boolean;
  onClick: () => void;
  index: number;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0, 0, 0";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

const FeatureTile: React.FC<FeatureTileProps> = ({
  title,
  description,
  icon,
  color,
  isHero = false,
  onClick,
  index,
}) => {
  const rgb = hexToRgb(color);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
      e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
    },
    []
  );

  return (
    <motion.button
      className={`feature-tile ${isHero ? "feature-tile--hero" : ""}`}
      style={
        {
          "--tile-color": color,
          "--tile-rgb": rgb,
        } as React.CSSProperties
      }
      onClick={onClick}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.07,
        ease: [0.25, 0.8, 0.25, 1],
      }}
    >
      {/* Mouse-tracking spotlight */}
      <div className="feature-tile__spotlight" />

      {/* Icon */}
      <div
        className="feature-tile__icon"
        style={{
          backgroundColor: color,
          boxShadow: `0 4px 16px rgba(${rgb}, 0.35)`,
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="feature-tile__content">
        <h3 className="feature-tile__title">{title}</h3>
        <p className="feature-tile__desc">{description}</p>
      </div>

      {/* Edge accent line */}
      <span className="feature-tile__accent" />
    </motion.button>
  );
};

export default FeatureTile;
