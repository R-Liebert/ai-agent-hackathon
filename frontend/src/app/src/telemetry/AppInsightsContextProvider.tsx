import React, {createContext, useContext} from 'react'
import {appInsights, reactPlugin} from './AppInsights'
import { useMsal } from '@azure/msal-react';

const AppInsightsContext = createContext(reactPlugin)

const AppInsightsContextProvider = ({children}: any) => {

    const {  accounts } = useMsal();

    React.useEffect(() => {
      if (accounts.length > 0) {
        const user = accounts[0];
        // Set authenticated user context
        appInsights.setAuthenticatedUserContext(
          user.username, 
          user.homeAccountId,
          true // Store in cookie
        );
      }
  
      return () => {
        // appInsights.clearAuthenticatedUserContext();
      }
    }, [accounts]);
  
  return (
    <AppInsightsContext.Provider value={reactPlugin}>
      {children}
    </AppInsightsContext.Provider>
  )
}

const useAppInsightsContext = () => useContext(AppInsightsContext)

export {AppInsightsContext, AppInsightsContextProvider, useAppInsightsContext}