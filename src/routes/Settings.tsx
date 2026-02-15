"use client";

import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import AppContext from "../AppContext";
import { useRouter } from "next/navigation";

export default function Settings() {
  const context = React.useContext(AppContext);
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [notificationPermission, setNotificationPermission] = React.useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  React.useEffect(() => {
    const storedName = localStorage.getItem("name") ?? "";
    setName(storedName);
    context?.setName(storedName);

    const storedNotificationsEnabled = localStorage.getItem("notifications_enabled");
    setNotificationsEnabled(storedNotificationsEnabled !== "false");

    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
    }
  }, [context]);

  React.useEffect(() => {
    const refreshPermission = () => {
      if (typeof Notification === "undefined") {
        setNotificationPermission("unsupported");
        return;
      }
      setNotificationPermission(Notification.permission);
    };

    document.addEventListener("visibilitychange", refreshPermission);
    window.addEventListener("focus", refreshPermission);

    return () => {
      document.removeEventListener("visibilitychange", refreshPermission);
      window.removeEventListener("focus", refreshPermission);
    };
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

    const cachedCommunityRaw = localStorage.getItem("community");
    if (cachedCommunityRaw) {
      try {
        const cachedCommunity = JSON.parse(cachedCommunityRaw);
        if (cachedCommunity?.webid === id) {
          context?.setCommunity(cachedCommunity);
          return;
        }
      } catch {
        localStorage.removeItem("community");
      }
    }

    context?.api.getCommunity(id)
      .then((community: any) => {
        if (!community) {
          router.replace("/");
          return;
        }
        context?.setCommunity(community);
        localStorage.setItem("community", JSON.stringify(community));
      })
      .catch(() => {});
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
    localStorage.removeItem("community");
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

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch {
      setNotificationPermission(Notification.permission);
    }
  }

  async function sendTestNotification() {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }

    if (Notification.permission !== "granted") return;

    const title = t("routes.settings.notifications_test_title");
    const body = t("routes.settings.notifications_test_body");

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, { body });
          return;
        }
      } catch {
        // noop
      }
    }

    try {
      new Notification(title, { body });
    } catch {
      // noop
    }
  }

  async function onNotificationToggleChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const nextEnabled = event.target.checked;

    if (!nextEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem("notifications_enabled", "false");
      return;
    }

    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      setNotificationsEnabled(false);
      localStorage.setItem("notifications_enabled", "false");
      return;
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      localStorage.setItem("notifications_enabled", "true");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      const enabled = permission === "granted";
      setNotificationsEnabled(enabled);
      localStorage.setItem("notifications_enabled", enabled ? "true" : "false");
    } catch {
      const currentPermission: NotificationPermission = Notification.permission;
      setNotificationPermission(currentPermission);
      const enabled = String(currentPermission) === "granted";
      setNotificationsEnabled(enabled);
      localStorage.setItem("notifications_enabled", enabled ? "true" : "false");
    }
  }

  function notificationStatusKey() {
    if (!notificationsEnabled) return "routes.settings.notifications_status_disabled";
    if (notificationPermission === "granted") return "routes.settings.notifications_status_granted";
    if (notificationPermission === "denied") return "routes.settings.notifications_status_denied";
    if (notificationPermission === "default") return "routes.settings.notifications_status_default";
    return "routes.settings.notifications_status_unsupported";
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
            name="username"
            fullWidth
            variant="standard"
            label={t("routes.settings.your_name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography gutterBottom variant="h6">
            {t("routes.settings.notifications_title")}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {t("routes.settings.notifications_description")}
          </Typography>
          <Box className="mt-2">
            <FormControlLabel
              control={(
                <Switch
                  checked={notificationsEnabled}
                  onChange={onNotificationToggleChanged}
                  disabled={notificationPermission === "unsupported"}
                />
              )}
              label={t("routes.settings.notifications_toggle")}
            />
          </Box>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            {t(notificationStatusKey())}
          </Typography>
          {notificationPermission === "granted" && notificationsEnabled ? (
            <Box className="mt-4">
              <Button variant="outlined" onClick={sendTestNotification}>
                {t("routes.settings.notifications_test")}
              </Button>
            </Box>
          ) : null}
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
