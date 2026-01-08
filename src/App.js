// App.js
import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomeScreenWrapper from "./pages/HomeScreen.js";
import AllTogetherWrapper from "./pages/AllTogether.js";
import EachAloneWrapper from "./pages/EachAlone.js";
import AboutWrapper from "./pages/About.js";

export default function App() {
  return (
    <BrowserRouter>
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
