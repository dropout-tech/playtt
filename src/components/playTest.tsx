import React from "react";
import styled, { keyframes } from "styled-components";
import { useInViewOnce } from "../hooks/useInViewOnce";
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
  0% { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.985); }
  60% { opacity: 1; transform: translate3d(0, -2px, 0) scale(1.01); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
`;

const shine = keyframes`
  0% { transform: translateX(-140%) skewX(-12deg); opacity: 0; }
  30% { opacity: 0.55; }
  70% { opacity: 0.18; }
  100% { transform: translateX(240%) skewX(-12deg); opacity: 0; }
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
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.985);
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 220ms ease, filter 220ms ease;

  &[data-inview="true"] {
    animation: ${fadeUp} 680ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

  &::after {
    content: "";
    position: absolute;
    inset: -40%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.45) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-140%) skewX(-12deg);
    opacity: 0;
    pointer-events: none;
  }

  &:hover {
    transform: translate3d(0, -6px, 0) rotate(-0.2deg);
    box-shadow: 0 16px 34px rgba(26, 26, 26, 0.16);
    filter: saturate(1.04);
  }

  &:hover::after {
    animation: ${shine} 720ms ease both;
  }

  ${media.tablet} {
    padding: ${theme.spacing.md};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    opacity: 1;
    transform: none;
    &[data-inview="true"] {
      animation: none;
    }
    &:hover {
      transform: none;
      filter: none;
    }
    &:hover::after {
      animation: none;
    }
  }
`;

const ImageCard = styled(Card)`
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.985);
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 220ms ease, filter 220ms ease;

  &[data-inview="true"] {
    animation: ${fadeUp} 680ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

  &::after {
    content: "";
    position: absolute;
    inset: -40%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.45) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-140%) skewX(-12deg);
    opacity: 0;
    pointer-events: none;
  }

  &:hover {
    transform: translate3d(0, -6px, 0) rotate(0.2deg);
    box-shadow: 0 16px 34px rgba(26, 26, 26, 0.16);
    filter: saturate(1.04);
  }

  &:hover::after {
    animation: ${shine} 720ms ease both;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    opacity: 1;
    transform: none;
    &[data-inview="true"] {
      animation: none;
    }
    &:hover {
      transform: none;
      filter: none;
    }
    &:hover::after {
      animation: none;
    }
  }
`;

const Image = styled.img`
  width: 100%;
  aspect-ratio: 4 / 5;
  height: auto;
  object-fit: cover;
  display: block;
  transition: transform 0.22s ease;

  ${media.tablet} {
    aspect-ratio: 16 / 10;
  }
`;

const MotionImageCard = styled(ImageCard)`
  &:hover ${Image} {
    transform: scale(1.04);
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
  const { ref: textRef, inView: textInView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  const { ref: imgRef, inView: imgInView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
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
              <TextCard ref={textRef} data-inview={textInView}>
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

              <MotionImageCard ref={imgRef} data-inview={imgInView} style={{ animationDelay: "120ms" }}>
                <Image src={testpic} alt="桌球檢定示意圖片" loading="lazy" />
              </MotionImageCard>
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default PlayTest;
