import React, { useEffect } from "react";
import "./LoginPage.css";
import { FC } from "react";
import DsbLogo from "../../images/dsblogo.png";
import { Paper } from "@mui/material";
import { useMsal, useIsAuthenticated } from "../../hooks/useMsalMock";
import { loginRequest } from "../../config";
import { Navigate } from "react-router-dom";

export const LoginPage: FC = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const handleSilentLogin = async () => {
      try {
        // Check if there is an active account
        if (accounts.length > 0) {
          // Use the first account as an example, you may adjust this logic based on your requirements
          const activeAccount = accounts[0];
          // Set the active account
          instance.setActiveAccount(activeAccount);
          // Try to acquire tokens silently
          await instance.acquireTokenSilent({
            ...loginRequest,
          });
          // If successful, redirect to the desired page (e.g., home page)
          // Adjust the path as needed
          return <Navigate to="/" replace />;
        } else {
          // If there is no active account, initiate interactive login
          handleLogin();
        }
      } catch (error) {
        // If silent authentication fails, do nothing or handle the error
        console.error("Silent authentication failed:", error);
      }
    };

    // Check if the user is already authenticated using silent authentication
    if (!isAuthenticated) {
      handleSilentLogin();
    }
  }, [isAuthenticated, instance, accounts]);

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      console.log(e);
    });
  };

  return (
    <>
      <div className="login wrapper flex items-center justify-center h-screen">
        <Paper
          className="login_paper bg-white-200 grid place-items-center"
          elevation={24}
          style={{ backgroundColor: "transparent", boxShadow: "none" }}
        >
          <div>
            <div className="title_logo flex justify-center items-center">
              <img alt="dsb logo" src={DsbLogo} className="mr-8" />
              <h2 className="fp-title text-slate-900">AI Launchpad</h2>
            </div>
            {/* <Button
              variant="contained"
              size="large"
              className="bg-primary-dark"
              onClick={handleLogin}
            >
              Login with Azure
            </Button> */}
          </div>
        </Paper>
      </div>
    </>
  );
};
