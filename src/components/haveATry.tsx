import React from "react";
import styled from "styled-components";
import { PageContainer, PrimaryButton, ButtonText as ButtonTextComponent, SectionTitle, SectionSubtitle } from "../styles/components";
import { theme, media } from "../styles/theme";

// 優化後的樣式組件
const Container = styled.div`
  ${media.tablet} {
    width: 100%;
  }
`;

const BlueArea = styled.div`
  background: ${theme.colors.primary};
  height: 306px;
  padding-top: ${theme.spacing.lg};
  padding-bottom: 174px;
  
  ${media.tablet} {
    padding-bottom: 0;
    width: 100%;
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
  return (
    <PageContainer id="haveATry">
      <Container>
        <BlueArea>
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
            統一由臉書私訊洽詢想預約試上的分店<SpanLine>Line</SpanLine>
          </InfoText>
        </BlueArea>

        <UnderContainer>
          <CopyrightText>Copyright © 2025 Let's Play</CopyrightText>
        </UnderContainer>
      </Container>
    </PageContainer>
  );
};

export default HaveATry;
