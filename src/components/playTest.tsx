import React from "react";
import styled, { keyframes } from "styled-components";
import {
  Card,
  Container,
  ContentWrapper,
  PageContainer,
  SectionSubtitle,
  SectionTitle,
  TitleGroup,
} from "../styles/components";
import { media, theme } from "../styles/theme";
import testpic from "../assets/playTest/testpic.png";

const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const SectionBg = styled.div`
  width: 100%;
  background: ${theme.colors.background};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: ${theme.spacing.lg};
  align-items: start;

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.md};
  }
`;

const TextCard = styled(Card)`
  padding: ${theme.spacing.lg};
  animation: ${fadeUp} 520ms ease both;

  ${media.tablet} {
    padding: ${theme.spacing.md};
  }
`;

const ImageCard = styled(Card)`
  animation: ${fadeUp} 520ms ease both;
  animation-delay: 120ms;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  max-height: 560px;
  object-fit: cover;
  display: block;
  transition: transform 0.22s ease;

  ${media.tablet} {
    max-height: 320px;
  }
`;

const MotionImageCard = styled(ImageCard)`
  &:hover ${Image} {
    transform: scale(1.02);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover ${Image} {
      transform: none;
    }
  }
`;

const Lead = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.lg};
  line-height: 32px;
  letter-spacing: 0.03em;
  color: ${theme.colors.text};

  ${media.tablet} {
    font-size: ${theme.fontSize.md};
    line-height: 28px;
  }
`;

const Steps = styled.div`
  margin-top: ${theme.spacing.md};
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${theme.spacing.sm};

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

const Step = styled.div`
  background: rgba(207, 210, 211, 0.2);
  border-radius: 14px;
  padding: 14px 14px 12px;
  transition: transform 0.18s ease;

  &:hover {
    transform: translateY(-2px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

const StepNo = styled.div`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: 18px;
  line-height: 24px;
  color: ${theme.colors.textMuted};
`;

const StepTitle = styled.div`
  margin-top: 6px;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: 18px;
  line-height: 28px;
  letter-spacing: 0.04em;
  color: ${theme.colors.primary};
`;

const Description = styled.p`
  margin: ${theme.spacing.md} 0 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 30px;
  letter-spacing: 0.02em;
  color: ${theme.colors.text};
`;

const Em = styled.span`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.primary};
`;

const PlayTest = () => {
  return (
    <PageContainer id="playTest">
      <SectionBg>
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>桌球檢定</SectionTitle>
              <SectionSubtitle>Let’s Play Test</SectionSubtitle>
            </TitleGroup>

            <Grid>
              <TextCard>
                <Lead>
                  <Em>Let’s Play</Em> 獨家精心規劃專屬檢定，結合三大面向，讓你在「玩」的過程裡進步看得見。
                </Lead>

                <Steps>
                  <Step>
                    <StepNo>01</StepNo>
                    <StepTitle>品勢 —— 揮拍姿勢</StepTitle>
                  </Step>
                  <Step>
                    <StepNo>02</StepNo>
                    <StepTitle>筆試 —— 桌球知識</StepTitle>
                  </Step>
                  <Step>
                    <StepNo>03</StepNo>
                    <StepTitle>體能 —— 敏捷反應</StepTitle>
                  </Step>
                </Steps>

                <Description>
                  設計成 <Em>L1–L12</Em> 檢定關卡，最後一關還有模擬比賽。教學內容搭配好玩的教案，
                  讓大家在樂趣中成長，用來幫助大小朋友測驗學習技術成果。
                  你意想不到的玩桌球，也可以學到、揮灑汗水、歡笑滿滿！
                </Description>
              </TextCard>

              <MotionImageCard>
                <Image src={testpic} alt="桌球檢定示意圖片" />
              </MotionImageCard>
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default PlayTest;
