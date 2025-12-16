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

import group from "../assets/letsPlayStar/group.png";
import group2 from "../assets/letsPlayStar/group2.png";
import img1 from "../assets/letsPlayStar/img1.png";
import img2 from "../assets/letsPlayStar/img2.png";

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
  background: ${theme.colors.secondary};
  position: relative;
  overflow: hidden;
`;

const Bg = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.85;
  background:
    radial-gradient(circle at 20% 28%, rgba(255, 255, 255, 0.55) 0 6px, rgba(255, 255, 255, 0) 7px),
    radial-gradient(circle at 28% 74%, rgba(255, 255, 255, 0.42) 0 5px, rgba(255, 255, 255, 0) 6px),
    radial-gradient(circle at 62% 34%, rgba(255, 255, 255, 0.40) 0 4px, rgba(255, 255, 255, 0) 5px),
    radial-gradient(circle at 78% 66%, rgba(255, 255, 255, 0.38) 0 4px, rgba(255, 255, 255, 0) 5px),
    radial-gradient(circle at 76% 22%, rgba(42, 210, 105, 0.18) 0 220px, rgba(42, 210, 105, 0) 420px),
    radial-gradient(circle at 72% 68%, rgba(242, 183, 43, 0.20) 0 220px, rgba(242, 183, 43, 0) 420px);
  background-repeat: no-repeat;
  background-size: cover;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};
`;

const Hero = styled(Card)`
  overflow: hidden;
  position: relative;
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
    transform: translate3d(0, -6px, 0) rotate(-0.25deg);
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

const HeroImgMobile = styled.div`
  width: 100%;
  height: 240px;
  background-image: url(${group2});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  display: none;

  ${media.tablet} {
    display: block;
  }
`;

const HeroImgDesktop = styled.img`
  width: 100%;
  height: 360px;
  object-fit: cover;
  display: block;

  ${media.tablet} {
    display: none;
  }
`;

const Info = styled(Card)`
  background: rgba(245, 246, 246, 0.9);
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

const Row = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  & + & {
    margin-top: 12px;
  }
`;

const Label = styled.div`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.primary};
`;

const Value = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  color: ${theme.colors.text};
`;

const Bullets = styled.ul`
  margin: ${theme.spacing.md} 0 0;
  padding: 0;
  list-style: none;
`;

const Bullet = styled.li`
  display: flex;
  gap: 10px;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  color: ${theme.colors.text};

  &::before {
    content: "・";
    color: ${theme.colors.textMuted};
    flex: 0 0 auto;
  }
`;

const IconRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const IconCard = styled(Card)`
  background: rgba(255, 255, 255, 0.65);
  padding: ${theme.spacing.md};
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 220ms ease, filter 220ms ease;

  &:hover {
    transform: translate3d(0, -6px, 0) rotate(-0.25deg);
    box-shadow: 0 16px 34px rgba(26, 26, 26, 0.16);
    filter: saturate(1.05);
  }

  &:hover img[data-role="icon"] {
    animation: ${iconPop} 520ms ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
      filter: none;
    }
    &:hover img[data-role="icon"] {
      animation: none;
    }
  }
`;

const Icon = styled.img`
  width: 84px;
  height: 72px;
  object-fit: contain;
  transform-origin: 70% 70%;
`;

const IconTitle = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.lg};
  line-height: 28px;
  color: ${theme.colors.text};
`;

const HeroItem = () => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  return (
    <Hero ref={ref} data-inview={inView}>
      <HeroImgMobile aria-hidden />
      <HeroImgDesktop src={group} alt="Let’s Play Star 團隊合照" />
    </Hero>
  );
};

const InfoItem = () => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  return (
    <Info ref={ref} data-inview={inView} style={{ animationDelay: "120ms" }}>
      <Row>
        <Label>成立於</Label>
        <Value>2020/12/15</Value>
      </Row>
      <Row>
        <Label>召集人</Label>
        <Value>Hero 戴祖雄 & 阿寬教練 郭則寬</Value>
      </Row>

      <Bullets>
        <Bullet>由專業教練團隊協助持續訓練</Bullet>
        <Bullet>大幅提升桌技和認知</Bullet>
        <Bullet>與贊助廠商合作營運</Bullet>
        <Bullet>每週練習 1–2 次</Bullet>
        <Bullet>與全明星運動會紅隊交流</Bullet>
        <Bullet>明星交流賽與檢定</Bullet>
      </Bullets>

      <IconRow>
        <IconCard>
          <Icon data-role="icon" src={img1} alt="" aria-hidden />
          <IconTitle>推廣桌球・提升全民風氣</IconTitle>
        </IconCard>
        <IconCard>
          <Icon data-role="icon" src={img2} alt="" aria-hidden />
          <IconTitle>公益桌球賽</IconTitle>
        </IconCard>
      </IconRow>
    </Info>
  );
};

const LetsPlayStar = () => {
  return (
    <PageContainer id="letsPlayStar">
      <SectionBg>
        <Bg aria-hidden="true" />
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>藝人明星桌球隊</SectionTitle>
              <SectionSubtitle>Let’s Play Star</SectionSubtitle>
            </TitleGroup>

            <Grid>
              <HeroItem />
              <InfoItem />
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default LetsPlayStar;
