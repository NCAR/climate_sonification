// App.js
import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomeScreenWrapper from "./pages/HomeScreen.jsx";
import AllTogetherWrapper from "./pages/AllTogether.jsx";
import EachAloneWrapper from "./pages/EachAlone.jsx";
import AboutWrapper from "./pages/About.jsx";

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
