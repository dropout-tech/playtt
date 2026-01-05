import React from "react";
import styled, { keyframes } from "styled-components";
import { PageContainer, PrimaryButton, ButtonText } from "../styles/components";
import { media, theme } from "../styles/theme";

const Banner = styled.section`
  width: 100%;
  height: 100vh;
  background: radial-gradient(circle at 18% 28%, rgba(56, 212, 48, 0.22) 0%, rgba(56, 212, 48, 0) 52%),
    radial-gradient(circle at 86% 62%, rgba(255, 217, 0, 0.22) 0%, rgba(255, 217, 0, 0) 58%),
    linear-gradient(135deg, #005cb9 0%, #004894 44%, #00346a 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: -40%;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 40%),
      radial-gradient(circle at 65% 65%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 44%);
    transform: rotate(10deg);
    pointer-events: none;
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
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.14) 0%, rgba(0, 0, 0, 0.08) 36%, rgba(0, 0, 0, 0.02) 100%);

  ${media.tablet} {
    padding: 0 ${theme.spacing.sm};
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.06) 60%, rgba(0, 0, 0, 0.02) 100%);
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
`;

const CtaPanel = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.65);
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
  color: ${theme.colors.text};
`;

const Sub = styled.p`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.03em;
  color: rgba(26, 26, 26, 0.86);
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
  border: 2px solid rgba(0, 92, 185, 0.65);
  background: rgba(255, 255, 255, 0.85);
  color: ${theme.colors.primary};
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
    background: rgba(255, 255, 255, 1);
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
