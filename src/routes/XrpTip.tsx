"use client";

import React from "react";
import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import TipbotApi from "../api/TipbotApi";

function isCoilRunning(): boolean {
  const monetization = (document as any).monetization;
  return Boolean(monetization && monetization.state === "started");
}

export default function XrpTip() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = React.useMemo(() => new TipbotApi(), []);

  const [handleInput, setHandleInput] = React.useState("");
  const [networkInput, setNetworkInput] = React.useState("");
  const [processing, setProcessing] = React.useState(false);

  const xrpAlreadySent = React.useCallback(() => localStorage.getItem("xrpSent") === "true", []);

  async function claim() {
    if (!isCoilRunning()) {
      alert(t("routes.xrptip.error_no_coil"));
      router.push("/");
      return;
    }

    if (xrpAlreadySent()) {
      alert(t("routes.xrptip.error_already_tipped"));
      router.push("/");
      return;
    }

    if (!handleInput.trim() || !networkInput.trim()) return;

    setProcessing(true);
    try {
      const response = await api.tipUser(handleInput.trim(), networkInput.trim());
      const code = response?.data?.code;
      if (code === 200) {
        localStorage.setItem("xrpSent", "true");
        alert(t("routes.xrptip.tip_sent"));
        router.push("/");
        return;
      }
      if (code === 300) {
        alert(t("routes.xrptip.error_tip_yourself"));
        router.push("/");
        return;
      }
      if (code === 401) {
        alert(t("routes.xrptip.error_no_balance"));
        router.push("/");
        return;
      }
      if (code === 405) {
        localStorage.setItem("xrpSent", "true");
        alert(t("routes.xrptip.error_already_tipped"));
        router.push("/");
        return;
      }
      alert(t("routes.xrptip.error_generic_response"));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Box className="flex flex-col gap-4">
          <Typography gutterBottom variant="h5">
            {t("routes.xrptip.title")}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>{t("routes.xrptip.subtitle")}</Typography>
          <TextField
            variant="standard"
            label={t("routes.xrptip.xrphandle")}
            value={handleInput}
            onChange={(event) => setHandleInput(event.target.value)}
          />
          <TextField
            select
            variant="standard"
            label="Network"
            value={networkInput}
            onChange={(event) => setNetworkInput(event.target.value)}
          >
            <MenuItem value="twitter">Twitter</MenuItem>
            <MenuItem value="reddit">Reddit</MenuItem>
            <MenuItem value="discord">Discord</MenuItem>
            <MenuItem value="coil">Coil</MenuItem>
          </TextField>
          <Button
            variant="contained"
            disabled={!handleInput.trim() || !networkInput.trim() || processing}
            onClick={claim}
          >
            {t("routes.xrptip.claim_reward")}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
