"use client";

import React from "react";
import { Snackbar } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AppContext from "../AppContext";
import LmApi from "../api/LmApi";
import "../i18n";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(false);
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [agreePrivacy, setAgreePrivacy] = React.useState(false);
  const [community, setCommunity] = React.useState<any>(null);
  const [name, setName] = React.useState("");
  const [snackText, setSnackText] = React.useState<string | null>(null);

  const api = React.useMemo(() => new LmApi(), []);

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
