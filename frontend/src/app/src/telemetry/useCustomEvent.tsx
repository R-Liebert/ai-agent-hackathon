import { ICustomProperties } from '@microsoft/applicationinsights-core-js';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

//Example usage of a custom hook that uses the Application Insights React Plugin to track custom events
// const AddToCart = ({productId}) => {
// const reactPlugin = useAppInsightsContext()
// const trackAddedToCart = useCustomEvent(reactPlugin, 'Added to Cart')
// const handleSubmit = async () => {
//   trackAddedToCart({quantity, cartId, productId})
// });

export default function useCustomEvent<T>(
  reactPlugin: ReactPlugin,
  eventName: string,
  eventData: T,
  skipFirstRun: boolean = true
): Dispatch<SetStateAction<T>> {
  const [data, setData] = useState<T>(eventData);
  const firstRun = useRef<boolean>(skipFirstRun);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    reactPlugin.trackEvent({ name: eventName }, data as ICustomProperties);
  }, [reactPlugin, data, eventName]);

  return setData;
}
