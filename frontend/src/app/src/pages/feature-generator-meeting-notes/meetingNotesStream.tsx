import { useState } from "react";
import { fetchEventSource } from "../../services/fetch";

interface StreamConfig {
  url: string;
  bodyParams: any;
  setData: React.Dispatch<React.SetStateAction<string>>; // This properly types the setData function
}

const useManualSSEStream = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  let controller = new AbortController();

  const startStream = ({ url, bodyParams, setData }: StreamConfig) => {
    setError(false);
    setLoading(true);
    controller = new AbortController();

    fetchEventSource(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyParams),
      signal: controller.signal,
      onmessage: (event) => {
        const eventData = JSON.parse(event.data);
        if (eventData.Content === "stream-ended") {
          controller.abort();
          setLoading(false);
          return;
        } else if (eventData.Content !== null) {
          setLoading(false);
          setData((prev) => `${prev}${eventData.Content}`);
        }
      },
      onerror: () => {
        setError(true);
        setLoading(false);
        controller.abort();
      },
    });
  };

  return { loading, error, startStream };
};

export default useManualSSEStream;
