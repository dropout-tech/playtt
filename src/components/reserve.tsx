import React from "react";
import styled, { keyframes } from "styled-components";
import { useInViewOnce } from "../hooks/useInViewOnce";
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
  background: ${theme.colors.backgroundLight};
  position: relative;
  overflow: hidden;
`;

const Bg = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.7;
  background:
    radial-gradient(circle at 18% 22%, rgba(42, 210, 105, 0.14) 0 240px, rgba(42, 210, 105, 0) 520px),
    radial-gradient(circle at 82% 30%, rgba(242, 183, 43, 0.16) 0 220px, rgba(242, 183, 43, 0) 520px),
    radial-gradient(circle at 12% 78%, rgba(255, 255, 255, 0.55) 0 6px, rgba(255, 255, 255, 0) 7px),
    radial-gradient(circle at 76% 78%, rgba(255, 255, 255, 0.46) 0 5px, rgba(255, 255, 255, 0) 6px);
  background-repeat: no-repeat;
  background-size: cover;
`;

const ReserveCard = styled(Card)`
  width: 100%;
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.md};
  position: relative;
  overflow: hidden;

  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.985);

  &[data-inview="true"] {
    animation: ${fadeUp} 680ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

  ${media.tablet} {
    padding: ${theme.spacing.lg};
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    &[data-inview="true"] {
      animation: none;
    }
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
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;

  &::after {
    content: "";
    position: absolute;
    inset: -40%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.35) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-140%) skewX(-12deg);
    opacity: 0;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 10px 30px rgba(26, 26, 26, 0.16);
    filter: saturate(1.04);
  }

  &:hover::after {
    animation: ${shine} 720ms ease both;
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
    &:hover::after {
      animation: none;
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
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -12% 0px", threshold: 0.18 });
  return (
    <PageContainer id="reserve">
      <SectionBg>
        <Bg aria-hidden="true" />
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>立即預約</SectionTitle>
              <SectionSubtitle>Reserve</SectionSubtitle>
            </TitleGroup>

            <ReserveCard ref={ref} data-inview={inView}>
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
