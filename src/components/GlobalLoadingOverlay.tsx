"use client";

import React from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

export default function GlobalLoadingOverlay({ open }: { open: boolean }) {
  const { t } = useTranslation();

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 200,
        backdropFilter: "blur(4px)",
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      <Box
        sx={{
          minWidth: { xs: 220, sm: 280 },
          px: 3,
          py: 2.5,
          borderRadius: 3,
          boxShadow: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.light} 130%)`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 0.9,
            "& .loader-dot": {
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "white",
              opacity: 0.9,
              animation: "lm-loader-bounce 1s infinite ease-in-out",
            },
            "& .loader-dot:nth-of-type(2)": {
              animationDelay: "0.15s",
            },
            "& .loader-dot:nth-of-type(3)": {
              animationDelay: "0.3s",
            },
            "@keyframes lm-loader-bounce": {
              "0%, 80%, 100%": {
                transform: "scale(0.72)",
                opacity: 0.45,
              },
              "40%": {
                transform: "scale(1)",
                opacity: 1,
              },
            },
          }}
        >
          <Box className="loader-dot" />
          <Box className="loader-dot" />
          <Box className="loader-dot" />
        </Box>
        <Typography sx={{ color: "white", fontWeight: 700, letterSpacing: 0.2 }}>
          {t("general.loading")}
        </Typography>
      </Box>
    </Backdrop>
  );
}
