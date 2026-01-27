import React, { lazy, Suspense } from "react";
import styled from "styled-components";
import Homepage from "../../components/homepage";
import TrialClassBlock from "../../components/TrialClassBlock";
import SEO from "../../components/common/SEO";

// Lazy-loaded components
const About = lazy(() => import("../../components/about"));
const OurCouchMembers = lazy(() => import("../../components/ourCouchMembers"));
const CoachList = lazy(() => import("../../components/CoachList"));
const PlayTest = lazy(() => import("../../components/playTest"));
const ConTest = lazy(() => import("../../components/conTest"));
const OtherService = lazy(() => import("../../components/otherService"));

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Home = () => {
  return (
    <>
      <SEO
        title="Let's Play 桌球聯盟 | 專業桌球課程與場地"
        description="Let's Play 提供最優質的桌球教學環境，無論是兒童桌球、成人桌球，還是場地租借，我們都有最專業的教練團隊與舒適的空間。"
      />
      <HomeContainer>
        <Homepage />
        <Suspense fallback={null}>
          <About />
          <CoachList />
          <PlayTest />
          <ConTest />
          <TrialClassBlock />
          <OtherService />
        </Suspense>
      </HomeContainer>
    </>
  );
};

export default Home;
