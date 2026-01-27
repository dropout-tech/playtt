import React from "react";
import styled, { keyframes } from "styled-components";
import { PageContainer } from "../styles/components";
import { media, theme } from "../styles/theme";

import banner1440 from "../assets/homepage/banner1440.png";
import banner1280 from "../assets/homepage/banner1280.png";
import banner1024 from "../assets/homepage/banner1024.png";
import banner768 from "../assets/homepage/banner768.png";
import banner414 from "../assets/homepage/banner414.png";

const Banner = styled.section`
  width: 100%;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for modern browsers */
  background-image: url(${banner1440});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;

  /* 響應式圖片切換 */
  ${media.desktop} {
    background-image: url(${banner1280});
   }

  ${media.laptop} {
    background-image: url(${banner1024});
  }

  ${media.tablet} {
    background-image: url(${banner768});
  }

  ${media.mobile} {
    background-image: url(${banner414});
   }
`;

const overlayIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Very light gradient to ensure the background image's own text is clear if needed */
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.05) 100%);
`;

const HeroBox = styled.div`
  width: 100%;
  max-width: 1200px;
  animation: ${overlayIn} 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
  text-align: center;
`;

const H1 = styled.h1`
  /* Visually hidden but accessible for SEO */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Homepage = () => {
  return (
    <PageContainer id="home">
      <Banner aria-label="Let’s Play 桌球聯盟首頁主視覺">
        <Overlay>
          <HeroBox>
            <H1>Let’s Play 桌球聯盟 - 專業桌球課程與場地租借</H1>
          </HeroBox>
        </Overlay>
      </Banner>
    </PageContainer>
  );
};

export default Homepage;
