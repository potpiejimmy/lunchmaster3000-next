"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default function Terms() {
  return (
    <Card>
      <CardContent>
        <iframe
          src="/legal/terms.html"
          title="terms"
          style={{ width: "100%", minHeight: "75vh", border: 0 }}
        />
      </CardContent>
    </Card>
  );
}
