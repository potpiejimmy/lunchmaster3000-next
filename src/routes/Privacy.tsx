"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default function Privacy() {
  return (
    <Card>
      <CardContent>
        <iframe
          src="/legal/privacy.html"
          title="privacy"
          style={{ width: "100%", minHeight: "75vh", border: 0 }}
        />
      </CardContent>
    </Card>
  );
}
