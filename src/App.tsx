import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomeScreenWrapper from "./pages/HomeScreen";
import AllTogetherWrapper from "./pages/AllTogether";
import EachAloneWrapper from "./pages/EachAlone";
import AboutWrapper from "./pages/About";

type AppProps = {
  tab: string;
};

export default function App({ tab }: AppProps): React.ReactElement {
  void tab;

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<HomeScreenWrapper />} />
        <Route path="/all-together" element={<AllTogetherWrapper />} />
        <Route path="/each-alone" element={<EachAloneWrapper />} />
        <Route path="/about" element={<AboutWrapper />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
