"use client";

import React from "react";
import { Snackbar } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AppContext from "../AppContext";
import LmApi from "../api/LmApi";
import GlobalLoadingOverlay from "../components/GlobalLoadingOverlay";
import "../i18n";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(false);
  const [serverUnavailable, setServerUnavailable] = React.useState(false);
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [agreePrivacy, setAgreePrivacy] = React.useState(false);
  const [community, setCommunity] = React.useState<any>(null);
  const [name, setName] = React.useState("");
  const [snackText, setSnackText] = React.useState<string | null>(null);
  const [networkActivityCount, setNetworkActivityCount] = React.useState(0);
  const [showGlobalLoadingOverlay, setShowGlobalLoadingOverlay] = React.useState(false);
  const loadingDelayTimeoutRef = React.useRef<number | null>(null);

  const api = React.useMemo(() => new LmApi(), []);

  React.useEffect(() => {
    return LmApi.subscribeNetworkLoading((_loading, activeRequestCount) => {
      setNetworkActivityCount(activeRequestCount);
    });
  }, []);

  React.useEffect(() => {
    return LmApi.subscribeNetworkErrors(() => {
      setServerUnavailable(true);
    });
  }, []);

  React.useEffect(() => {
    return LmApi.subscribeNetworkRecovered(() => {
      setServerUnavailable(false);
    });
  }, []);

  React.useEffect(() => {
    const hasLoading = loading || networkActivityCount > 0;

    if (hasLoading) {
      if (loadingDelayTimeoutRef.current !== null) return;
      loadingDelayTimeoutRef.current = window.setTimeout(() => {
        setShowGlobalLoadingOverlay(true);
        loadingDelayTimeoutRef.current = null;
      }, 500);
      return;
    }

    if (loadingDelayTimeoutRef.current !== null) {
      window.clearTimeout(loadingDelayTimeoutRef.current);
      loadingDelayTimeoutRef.current = null;
    }
    setShowGlobalLoadingOverlay(false);
  }, [loading, networkActivityCount]);

  React.useEffect(() => {
    return () => {
      if (loadingDelayTimeoutRef.current !== null) {
        window.clearTimeout(loadingDelayTimeoutRef.current);
      }
    };
  }, []);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            light: "rgb(251, 251, 221)",
            main: "#4CAF50",
            dark: "#2E7D32",
            contrastText: "#fff",
          },
          secondary: {
            light: "#ff7961",
            main: "#f44336",
            dark: "#ba000d",
            contrastText: "#000",
          },
        },
        typography: {
          fontFamily: [
            "PT Sans",
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
          ].join(","),
        },
      }),
    []
  );

  return (
    <AppContext.Provider
      value={{
        api,
        loading,
        setLoading,
        serverUnavailable,
        setServerUnavailable,
        agreeTerms,
        setAgreeTerms,
        agreePrivacy,
        setAgreePrivacy,
        community,
        setCommunity,
        name,
        setName,
        snackText,
        setSnackText,
      }}
    >
      <ThemeProvider theme={theme}>
        {children}
        <GlobalLoadingOverlay open={showGlobalLoadingOverlay} />
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          open={snackText !== null}
          autoHideDuration={3000}
          onClose={() => setSnackText(null)}
          message={snackText}
        />
      </ThemeProvider>
    </AppContext.Provider>
  );
}
