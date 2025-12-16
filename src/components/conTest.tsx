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
  background: rgba(207, 210, 211, 0.2);
  position: relative;
  overflow: hidden;
`;

const HalfCircle = styled.div`
  position: absolute;
  top: -240px;
  left: -240px;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}20 0%, ${theme.colors.secondary}20 100%);
  z-index: 0;
  animation: float 6s ease-in-out infinite;

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  ${media.tablet} {
    width: 380px;
    height: 380px;
    top: -190px;
    left: -190px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: ${theme.spacing.lg};
  align-items: start;
  position: relative;
  z-index: 1;

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.md};
  }
`;

const Intro = styled.div`
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.985);

  &[data-inview="true"] {
    animation: ${fadeUp} 680ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    &[data-inview="true"] {
      animation: none;
    }
  }
`;

const Lead = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: ${theme.colors.textLight};

  ${media.tablet} {
    font-size: 20px;
    line-height: 34px;
  }
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${theme.spacing.md};
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.985);

  &[data-inview="true"] {
    animation: ${fadeUp} 680ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    &[data-inview="true"] {
      animation: none;
    }
  }
`;

const MatchCard = styled(Card)`
  padding: ${theme.spacing.lg};
  position: relative;
  overflow: hidden;
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 220ms ease, filter 220ms ease;

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
    &:hover {
      transform: none;
      filter: none;
    }
    &:hover::after {
      animation: none;
    }
  }
`;

const Pill = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 28px;
  background: ${theme.colors.secondary};
  box-shadow: 0 4px 20px rgba(26, 26, 26, 0.07);
`;

const PillText = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxl};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.primary};

  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
    line-height: 28px;
  }
`;

const Desc = styled.p`
  margin: ${theme.spacing.sm} 0 0;
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
`;

const ConTest = () => {
  const { ref: introRef, inView: introInView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  const { ref: cardsRef, inView: cardsInView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  return (
    <PageContainer id="conTest">
      <SectionBg>
        <HalfCircle aria-hidden />
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>桌球賽事</SectionTitle>
              <SectionSubtitle>Let’s Play Match</SectionSubtitle>
            </TitleGroup>

            <Grid>
              <Intro ref={introRef} data-inview={introInView}>
                <Lead>比賽可以幫助你們靈活應用桌球小技巧，是很好的自我檢視方式。</Lead>
              </Intro>

              <Cards ref={cardsRef} data-inview={cardsInView} style={{ animationDelay: "120ms" }}>
                <MatchCard>
                  <Pill>
                    <PillText>邀請賽</PillText>
                  </Pill>
                  <Desc>
                    由 <Em>Let’s Play</Em> 發出邀請，讓小小選手們有發光表現的舞台。
                  </Desc>
                </MatchCard>

                <MatchCard>
                  <Pill>
                    <PillText>積分賽</PillText>
                  </Pill>
                  <Desc>於台灣桌球積分賽平台刊登，是一個訓練比賽經驗的平台，每一個月最少兩次的比賽。</Desc>
                </MatchCard>

                <MatchCard>
                  <Pill>
                    <PillText>學員盃</PillText>
                  </Pill>
                  <Desc>
                    <Em>Let’s Play</Em> 館內學員定期對內交流比賽，增加小朋友的學習動力與成果技巧的靈活運用。
                  </Desc>
                </MatchCard>
              </Cards>
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default ConTest;
