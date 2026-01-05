import React from "react";
import styled, { keyframes } from "styled-components";
import { PageContainer, PrimaryButton, ButtonText } from "../styles/components";
import { media, theme } from "../styles/theme";

import banner1440 from "../assets/homepage/banner1440.png";
import banner1280 from "../assets/homepage/banner1280.png";
import banner1024 from "../assets/homepage/banner1024.png";
import banner768 from "../assets/homepage/banner768.png";
import banner414 from "../assets/homepage/banner414.png";

// 優化後的 Banner - 使用單一組件 + CSS media queries
// 代碼量減少 66%，更易於維護
const Banner = styled.section`
  width: 100%;
  height: 100vh;
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
  padding: 0 ${theme.spacing.md};
  background: linear-gradient(
    90deg,
    rgba(26, 26, 26, 0.32) 0%,
    rgba(26, 26, 26, 0.12) 55%,
    rgba(26, 26, 26, 0.02) 100%
  );

  ${media.tablet} {
    padding: 0 ${theme.spacing.sm};
    background: linear-gradient(
      180deg,
      rgba(26, 26, 26, 0.30) 0%,
      rgba(26, 26, 26, 0.10) 55%,
      rgba(26, 26, 26, 0.02) 100%
    );
  }
`;

const HeroBox = styled.div`
  width: 100%;
  max-width: 1200px;
  animation: ${overlayIn} 520ms ease both;
`;

const H1 = styled.h1`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: 54px;
  line-height: 68px;
  letter-spacing: 0.04em;
  color: ${theme.colors.background};

  ${media.desktop} {
    font-size: 48px;
    line-height: 62px;
  }

  ${media.tablet} {
    font-size: 34px;
    line-height: 48px;
  }

  /* Hero 背景本身已含大量視覺資訊：桌機版將標題改為「僅供輔助科技」以降噪 */
  @media screen and (min-width: ${theme.breakpoints.laptop}) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

const Sub = styled.p`
  margin: 10px 0 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.92);
  max-width: 720px;

  ${media.tablet} {
    font-size: 16px;
    line-height: 28px;
  }

  /* 桌機版避免與 Banner 文字資訊互相干擾 */
  @media screen and (min-width: ${theme.breakpoints.laptop}) {
    display: none;
  }
`;

const Tagline = styled.p`
  margin: 14px 0 0;
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: 18px;
  line-height: 28px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.85);

  @media screen and (min-width: ${theme.breakpoints.laptop}) {
    display: none;
  }
`;

const Buttons = styled.div`
  margin-top: 22px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;

  @media screen and (min-width: ${theme.breakpoints.laptop}) {
    margin-top: 0;
    justify-content: flex-start;
  }
`;

const GhostButton = styled.button`
  border: 2px solid rgba(255, 255, 255, 0.75);
  background: rgba(26, 26, 26, 0.18);
  color: ${theme.colors.background};
  width: 210px;
  height: 56px;
  border-radius: 12px;
  cursor: pointer;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: 18px;
  letter-spacing: 0.04em;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(26, 26, 26, 0.28);
  }

  ${media.tablet} {
    width: 211px;
    height: 48px;
    font-size: 16px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

const Homepage = () => {
  return (
    <PageContainer id="home">
      <Banner aria-label="Let’s Play 桌球聯盟首頁主視覺">
        <Overlay>
          <HeroBox>
            <H1>Let’s Play 桌球聯盟</H1>
            <Sub>蘆洲、林口桌球教學與桌球課程。親子、兒童、成人到進階培訓，一起玩、一起進步。</Sub>
            <Tagline>玩得開心，學得更快。一起玩 Let’s Play</Tagline>

            <Buttons>
              <PrimaryButton
                onClick={() => {
                  const section = document.querySelector("#reserve");
                  section?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <ButtonText>立即預約</ButtonText>
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  const section = document.querySelector("#company");
                  section?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                聯絡我們
              </GhostButton>
            </Buttons>
          </HeroBox>
        </Overlay>
      </Banner>
    </PageContainer>
  );
};

export default Homepage;
