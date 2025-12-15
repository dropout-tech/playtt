import React from "react";
import styled, { keyframes } from "styled-components";
import {
  ButtonText,
  Card,
  Container,
  ContentWrapper,
  PageContainer,
  SectionSubtitle,
  SectionTitle,
  TitleGroup,
} from "../styles/components";
import { media, theme } from "../styles/theme";

const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const SectionBg = styled.div`
  width: 100%;
  background: ${theme.colors.backgroundLight};
`;

const ReserveCard = styled(Card)`
  width: 100%;
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.md};
  animation: ${fadeUp} 520ms ease both;

  ${media.tablet} {
    padding: ${theme.spacing.lg};
  }
`;

const AccentButton = styled.button`
  border: none;
  width: 374px;
  height: 72px;
  border-radius: 12px;
  background: ${theme.colors.accent};
  box-shadow: 0px 6px 24px rgba(26, 26, 26, 0.12);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 10px 30px rgba(26, 26, 26, 0.16);
    filter: saturate(1.04);
  }

  &:active {
    transform: translateY(0);
  }

  ${media.tablet} {
    width: 211px;
    height: 48px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

const AccentButtonText = styled(ButtonText)`
  color: ${theme.colors.background};
`;

const Hint = styled.p`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  letter-spacing: 0.03em;
  color: ${theme.colors.text};
  text-align: center;

  ${media.tablet} {
    font-size: ${theme.fontSize.sm};
    line-height: 24px;
  }
`;

const Reserve = () => {
  return (
    <PageContainer id="reserve">
      <SectionBg>
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>立即預約</SectionTitle>
              <SectionSubtitle>Reserve</SectionSubtitle>
            </TitleGroup>

            <ReserveCard>
              <AccentButton
                onClick={() => {
                  window.open("https://www.facebook.com/playpp2018", "_parent");
                }}
              >
                <AccentButtonText>立即預約免費試上</AccentButtonText>
              </AccentButton>
              <Hint>統一由臉書私訊洽詢想預約試上的分店（也可先私訊 Line @869usyqy）</Hint>
            </ReserveCard>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default Reserve;
