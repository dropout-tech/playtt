import React from "react";
import styled, { keyframes } from "styled-components";
import { PageContainer, PrimaryButton, ButtonText as ButtonTextComponent, SectionTitle, SectionSubtitle } from "../styles/components";
import { theme, media } from "../styles/theme";
import { useInViewOnce } from "../hooks/useInViewOnce";

// 優化後的樣式組件
const Container = styled.div`
  ${media.tablet} {
    width: 100%;
  }
`;

const BlueArea = styled.div`
  background: ${theme.colors.primary};
  min-height: 306px;
  padding-top: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.xxl};
  position: relative;
  overflow: hidden;
  
  ${media.tablet} {
    padding-bottom: ${theme.spacing.lg};
    width: 100%;
  }
`;

const popIn = keyframes`
  0% { opacity: 0; transform: translate3d(0, 14px, 0) scale(0.985); }
  60% { opacity: 1; transform: translate3d(0, -2px, 0) scale(1.01); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
`;

const float = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -12px, 0); }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translate3d(0, 14px, 0) scale(0.985);

  &[data-inview="true"] {
    animation: ${popIn} 720ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    &[data-inview="true"] {
      animation: none;
    }
  }
`;

const Decor = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.95;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    mix-blend-mode: soft-light;
    animation: ${float} 6.2s ease-in-out infinite;
  }

  &::before {
    width: 520px;
    height: 520px;
    right: -260px;
    top: -280px;
    background:
      radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.55) 0 12%, rgba(255, 255, 255, 0) 30%),
      conic-gradient(from 90deg, rgba(42, 210, 105, 0.22), rgba(242, 183, 43, 0.18), rgba(42, 210, 105, 0.22));
    opacity: 0.7;
  }

  &::after {
    width: 760px;
    height: 420px;
    left: -320px;
    bottom: -240px;
    background-image:
      radial-gradient(circle at 12% 20%, rgba(255, 255, 255, 0.55) 0 6px, rgba(255, 255, 255, 0) 7px),
      radial-gradient(circle at 22% 72%, rgba(255, 255, 255, 0.45) 0 5px, rgba(255, 255, 255, 0) 6px),
      radial-gradient(circle at 42% 34%, rgba(255, 255, 255, 0.38) 0 4px, rgba(255, 255, 255, 0) 5px),
      radial-gradient(circle at 58% 66%, rgba(255, 255, 255, 0.36) 0 4px, rgba(255, 255, 255, 0) 5px),
      radial-gradient(circle at 76% 26%, rgba(255, 255, 255, 0.42) 0 5px, rgba(255, 255, 255, 0) 6px),
      radial-gradient(circle at 86% 74%, rgba(255, 255, 255, 0.34) 0 4px, rgba(255, 255, 255, 0) 5px);
    background-repeat: no-repeat;
    background-size: cover;
    opacity: 0.6;
    animation-delay: 0.35s;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      animation: none;
    }
  }
`;

const TopText = styled.div`
  margin-top: 50px;
  
  ${media.tablet} {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: ${theme.spacing.lg};
  }
`;

const WhiteTitle = styled(SectionTitle)`
  color: ${theme.colors.background};
`;

const WhiteSubtitle = styled(SectionSubtitle)`
  color: ${theme.colors.textMuted};
`;

const ButtonAreas = styled.div`
  display: flex;
  margin-top: ${theme.spacing.xxl};
  justify-content: center;
  
  ${media.tablet} {
    margin-top: 14px;
  }
`;

const InfoText = styled.p`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.lg};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.background};
  display: flex;
  justify-content: center;
  
  ${media.tablet} {
    font-size: ${theme.fontSize.sm};
    line-height: 28px;
    letter-spacing: 0.06em;
    margin-top: ${theme.spacing.md};
    align-items: center;
    text-align: center;
  }
`;

const SpanLine = styled.span`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.lg};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.background};
  
  ${media.tablet} {
    font-size: ${theme.fontSize.sm};
    line-height: 28px;
    letter-spacing: 0.06em;
    margin-left: 4px;
  }
`;

const UnderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: ${theme.spacing.xs};
  padding-bottom: ${theme.spacing.xs};
`;

const CopyrightText = styled.p`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.sm};
  line-height: 24px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.08em;
  color: ${theme.colors.textLight};
  
  ${media.tablet} {
    font-size: 12px;
    line-height: 24px;
  }
`;
const HaveATry = () => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -12% 0px", threshold: 0.18 });
  return (
    <PageContainer id="haveATry">
      <Container>
        <BlueArea>
          <Decor aria-hidden="true" />
          <Content ref={ref} data-inview={inView}>
            <TopText>
              <WhiteTitle>預約體驗</WhiteTitle>
              <WhiteSubtitle>Have a Try</WhiteSubtitle>
            </TopText>

            <ButtonAreas>
              <PrimaryButton
                onClick={() => {
                  window.open("https://www.facebook.com/playpp2018", "_parent");
                }}
              >
                <ButtonTextComponent>立即預約免費試上</ButtonTextComponent>
              </PrimaryButton>
            </ButtonAreas>

            <InfoText>
              統一由臉書私訊洽詢想預約試上的分店 <SpanLine>Line</SpanLine>
            </InfoText>
          </Content>
        </BlueArea>

        <UnderContainer>
          <CopyrightText>Copyright © 2025 Let's Play</CopyrightText>
        </UnderContainer>
      </Container>
    </PageContainer>
  );
};

export default HaveATry;
