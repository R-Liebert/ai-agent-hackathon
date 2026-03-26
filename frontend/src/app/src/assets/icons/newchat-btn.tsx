import React from "react";

interface NewChatButtonProps {
  width?: string | number;
  height?: string | number;
  color?: string;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({
  width = 22,
  height = 20,
  color = "#f9f9f9",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 21 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.49951 2.49927C4.49951 2.49927 2.99951 3.99927 2.99951 6.99927V16.7493C2.99951 17.1618 3.33701 17.4993 3.74951 17.4993H13.4995C16.4995 17.4993 17.9995 15.9993 17.9995 12.9993"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.3226 3.37323L7.92026 8.77557C7.71208 8.98375 7.51431 9.38971 7.47267 9.68117L7.18122 11.7422C7.07713 12.4916 7.59758 13.0121 8.34704 12.908L10.408 12.6165C10.6995 12.5749 11.1055 12.3771 11.3136 12.169L16.716 6.7666C17.6424 5.84019 18.09 4.75764 16.716 3.38363C15.342 1.99922 14.2594 2.4364 13.3226 3.37323Z"
        stroke={color}
        strokeWidth="1.2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5522 4.1427C13.0102 5.77694 14.2906 7.06767 15.9352 7.52567"
        stroke={color}
        strokeWidth="1.2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default NewChatButton;
