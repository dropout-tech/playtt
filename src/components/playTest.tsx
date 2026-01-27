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

const Em = styled.span`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
`;

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

const DecorationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${fadeUp} 520ms ease both;
  animation-delay: 120ms;
`;

const DecorationImage = styled.img`
  max-width: 100%;
  height: auto;
  max-height: 560px;
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.06));

  ${media.tablet} {
    max-height: 320px;
  }
`;

const Lead = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: 28px;
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: ${theme.colors.textLight};

  ${media.tablet} {
    font-size: 20px;
  }
`;

const Steps = styled.div`
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StepNo = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: 900;
  font-size: 40px;
  line-height: 1;
  color: #E0E0E0;
`;

const StepTitle = styled.h4`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.bold};
  font-size: 20px;
  color: ${theme.colors.text};
`;

const Description = styled.p`
  margin-top: 32px;
  font-size: 16px;
  line-height: 1.8;
  color: ${theme.colors.textLight};
  text-align: justify;
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

              <DecorationContainer>
                <DecorationImage src={testpic} alt="桌球檢定示意圖片" />
              </DecorationContainer>
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default PlayTest;
