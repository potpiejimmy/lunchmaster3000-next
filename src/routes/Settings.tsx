"use client";

import React from "react";
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppContext from "../AppContext";
import { useRouter } from "next/navigation";

export default function Settings() {
  const context = React.useContext(AppContext);
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    const storedName = localStorage.getItem("name") ?? "";
    setName(storedName);
    context?.setName(storedName);
  }, []);

  React.useEffect(() => {
    const currentSearch = new URLSearchParams(window.location.search);
    let id = currentSearch.get("id");

    if (id) localStorage.setItem("id", id);
    else id = localStorage.getItem("id");

    if (!id) {
      router.replace("/");
      return;
    }

    if (context?.community?.webid === id) return;

    context?.setLoading(true);
    context?.api.getCommunity(id)
      .then((community: any) => {
        if (!community) {
          router.replace("/");
          return;
        }
        context?.setCommunity(community);
      })
      .finally(() => context?.setLoading(false));
  }, [router, context]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("name", name);
      context?.setName(name);
    }, 800);
    return () => clearTimeout(timer);
  }, [name]);

  function leaveCommunity() {
    localStorage.removeItem("id");
    context?.setCommunity(null);
    context?.setName("");
    router.push("/");
  }

  function openConfirmLeaving() {
    setConfirmOpen(true);
  }

  function closeConfirmLeaving() {
    setConfirmOpen(false);
  }

  function confirmLeaving() {
    closeConfirmLeaving();
    leaveCommunity();
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
            <Button color="error" variant="contained" onClick={openConfirmLeaving}>
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

      <Dialog
        open={confirmOpen}
        onClose={closeConfirmLeaving}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("routes.settings.confirm_deletion_header")}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary" }}>
            {t("routes.settings.confirm_deletion_question")}
            {context?.community?.name ?? ""}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeConfirmLeaving}>{t("routes.settings.confirm_deletion_no")}</Button>
          <Button variant="contained" color="error" onClick={confirmLeaving}>
            {t("routes.settings.confirm_deletion_yes")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
