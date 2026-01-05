import React from "react";
import styled, { keyframes } from "styled-components";
import { PageContainer, PrimaryButton, ButtonText } from "../styles/components";
import { media, theme } from "../styles/theme";

import banner1440 from "../assets/homepage/banner1440.png";
import banner1280 from "../assets/homepage/banner1280.png";
import banner1024 from "../assets/homepage/banner1024.png";
import banner768 from "../assets/homepage/banner768.png";
import banner414 from "../assets/homepage/banner414.png";

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
  align-items: flex-end;
  justify-content: center;
  padding: 0 ${theme.spacing.md};
  /* 保留海報風格：只在底部加輕遮罩，讓 CTA 有穩定可讀性 */
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.10) 55%, rgba(0, 0, 0, 0.22) 100%);

  ${media.tablet} {
    align-items: center;
    padding: 0 ${theme.spacing.sm};
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.10) 60%, rgba(0, 0, 0, 0.06) 100%);
  }
`;

const HeroBox = styled.div`
  width: 100%;
  max-width: 1200px;
  animation: ${overlayIn} 520ms ease both;
  padding-bottom: ${theme.spacing.xl};

  ${media.tablet} {
    padding-bottom: 0;
  }
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

  /* 桌機海報圖已含大標：保留可及性，但避免重疊造成雜亂 */
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

const CtaPanel = styled.div`
  margin-top: 0;
  display: inline-flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 16px 14px;
  border-radius: 16px;
  background: rgba(26, 26, 26, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);

  ${media.tablet} {
    width: 100%;
    max-width: 520px;
  }
`;

const MicroCopy = styled.p`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.md};
  line-height: 26px;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.92);
`;

const Sub = styled.p`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.88);
  max-width: 720px;

  ${media.tablet} {
    font-size: 16px;
    line-height: 28px;
  }
`;

const Buttons = styled.div`
  margin-top: 0;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;

  @media screen and (min-width: ${theme.breakpoints.laptop}) {
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
            <CtaPanel>
              <MicroCopy>蘆洲・林口｜桌球教學・課程・場地｜親子・兒童・成人・進階</MicroCopy>
              <Sub>一起玩、一起進步。玩得開心，學得更快。</Sub>

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
            </CtaPanel>
          </HeroBox>
        </Overlay>
      </Banner>
    </PageContainer>
  );
};

export default Homepage;
