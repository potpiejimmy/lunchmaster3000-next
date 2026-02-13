"use client";

import React from "react";
import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppContext from "../AppContext";
import { useRouter } from "next/navigation";

export default function Settings() {
  const context = React.useContext(AppContext);
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    setName(localStorage.getItem("name") ?? "");
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("name", name);
      context?.setName(name);
    }, 800);
    return () => clearTimeout(timer);
  }, [name, context]);

  function leaveCommunity() {
    localStorage.removeItem("id");
    context?.setCommunity(null);
    context?.setName("");
    router.push("/");
  }

  function confirmLeaving() {
    const question = `${t("routes.settings.confirm_deletion_question")}${context?.community?.name ?? ""}?`;
    if (window.confirm(question)) leaveCommunity();
  }

  return (
    <Box className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <Typography gutterBottom variant="h5">
            {t("routes.settings.card_title")}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {context?.community?.name}
          </Typography>
          <Box className="mt-4">
            <Button color="error" variant="contained" onClick={confirmLeaving}>
              {t("routes.settings.community_leave")}
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <TextField
            fullWidth
            variant="standard"
            label={t("routes.settings.your_name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
