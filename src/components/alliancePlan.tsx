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

import cho from "../assets/alliancePlan/cho.png";
import hha from "../assets/alliancePlan/hha.png";
import ho from "../assets/alliancePlan/ho.png";

type Block = {
  title: string;
  iconSrc: string;
  content: React.ReactNode;
};

const Em = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: theme.fonts.secondary, fontWeight: theme.fontWeight.bold }}>{children}</span>
);

const Strong = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: theme.fonts.primary, fontWeight: theme.fontWeight.black }}>{children}</span>
);

const BLOCKS: Block[] = [
  {
    title: "創立初衷",
    iconSrc: cho,
    content: (
      <>
        將既有的桌球經營 <Em>Know How</Em> 傳承與系統規劃，改善桌球產業發展，希望透過每位老闆力量，
        共同團結讓台灣桌球被更多人看見！
      </>
    ),
  },
  {
    title: "計畫簡介",
    iconSrc: hha,
    content: (
      <>
        <Em>Let’s Play</Em> 立志打造跨界聯盟的創新桌球團隊，主軸為三大方向：跨產業合作 <Em> X </Em> 全齡複合空間 <Em> X </Em>
        運動設計美學。希望共享資源讓台灣桌球產業互利合作，推廣讓全年齡的朋友們愛上桌球，一起體驗桌球的好處和快樂！
      </>
    ),
  },
  {
    title: "聯盟分佈",
    iconSrc: ho,
    content: (
      <>
        全台目前據點為 <Em>2</Em> 家（蘆洲店、林口店）
        <br />
        <Strong>陸續招募中！</Strong>
      </>
    ),
  },
];

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

const iconPop = keyframes`
  0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
  35% { transform: translate3d(0, -4px, 0) scale(1.06) rotate(-6deg); }
  70% { transform: translate3d(0, 0, 0) scale(1.02) rotate(6deg); }
  100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
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
    radial-gradient(circle at 24% 66%, rgba(255, 255, 255, 0.42) 0 5px, rgba(255, 255, 255, 0) 6px),
    radial-gradient(circle at 76% 78%, rgba(255, 255, 255, 0.46) 0 5px, rgba(255, 255, 255, 0) 6px),
    radial-gradient(circle at 88% 62%, rgba(255, 255, 255, 0.40) 0 4px, rgba(255, 255, 255, 0) 5px);
  background-repeat: no-repeat;
  background-size: cover;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${theme.spacing.md};

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const BlockCard = styled(Card)`
  padding: ${theme.spacing.lg};
  position: relative;
  overflow: hidden;

  /* 捲到才播放 */
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.985);

  &[data-inview="true"] {
    animation: ${fadeUp} 680ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

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
    transform: translate3d(0, -6px, 0) rotate(-0.25deg);
    box-shadow: 0 16px 34px rgba(26, 26, 26, 0.16);
    filter: saturate(1.04);
  }

  &:hover::after {
    animation: ${shine} 720ms ease both;
  }

  &:hover img[data-role="icon"] {
    animation: ${iconPop} 520ms ease-in-out;
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
    &:hover img[data-role="icon"] {
      animation: none;
    }
  }
`;

const IconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const Icon = styled.img`
  width: 130px;
  height: 64px;
  object-fit: contain;
  transform-origin: 70% 70%;

  ${media.tablet} {
    width: 110px;
    height: 54px;
  }
`;

const BlockTitle = styled.h3`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: ${theme.colors.primary};

  ${media.tablet} {
    font-size: 20px;
    line-height: 32px;
  }
`;

const Body = styled.p`
  margin: ${theme.spacing.md} 0 0;
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

const BlockItem = ({ b, idx }: { b: Block; idx: number }) => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  return (
    <BlockCard ref={ref} data-inview={inView} style={{ animationDelay: `${idx * 110}ms` }}>
      <IconRow>
        <Icon data-role="icon" src={b.iconSrc} alt="" aria-hidden />
        <BlockTitle>{b.title}</BlockTitle>
      </IconRow>
      <Body>{b.content}</Body>
    </BlockCard>
  );
};

const AlliancePlan = () => {
  return (
    <PageContainer id="alliancePlan">
      <SectionBg>
        <Bg aria-hidden="true" />
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>聯盟計畫</SectionTitle>
              <SectionSubtitle>Alliance</SectionSubtitle>
            </TitleGroup>

            <Grid>
              {BLOCKS.map((b, idx) => (
                <BlockItem key={b.title} b={b} idx={idx} />
              ))}
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default AlliancePlan;
