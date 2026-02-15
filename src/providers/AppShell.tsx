"use client";

import React from "react";
import Box from "@mui/material/Box";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegister />
      <TopBar />
      <Box className="flex flex-col gap-4 mx-4 my-4 lg:mx-16 lg:my-8">
        {children}
        <Footer />
      </Box>
    </>
  );
}
