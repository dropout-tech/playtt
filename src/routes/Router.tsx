import * as React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/home/Home";
import PartnerPage from "../pages/partner/PartnerPage";
import ClassPage from "../pages/class/ClassPage";
import Layout from "../components/common/Layout";

function Router() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/partner" element={<PartnerPage />} />
        <Route path="/class" element={<ClassPage />} />
      </Routes>
    </Layout>
  );
}

export default Router;
