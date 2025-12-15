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

import group from "../assets/letsPlayStar/group.png";
import group2 from "../assets/letsPlayStar/group2.png";
import img1 from "../assets/letsPlayStar/img1.png";
import img2 from "../assets/letsPlayStar/img2.png";

const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const SectionBg = styled.div`
  width: 100%;
  background: ${theme.colors.secondary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};
`;

const Hero = styled(Card)`
  overflow: hidden;
  animation: ${fadeUp} 520ms ease both;
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
  animation: ${fadeUp} 520ms ease both;
  animation-delay: 120ms;

  ${media.tablet} {
    padding: ${theme.spacing.md};
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
`;

const Icon = styled.img`
  width: 84px;
  height: 72px;
  object-fit: contain;
`;

const IconTitle = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.lg};
  line-height: 28px;
  color: ${theme.colors.text};
`;

const LetsPlayStar = () => {
  return (
    <PageContainer id="letsPlayStar">
      <SectionBg>
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>藝人明星桌球隊</SectionTitle>
              <SectionSubtitle>Let’s Play Star</SectionSubtitle>
            </TitleGroup>

            <Grid>
              <Hero>
                <HeroImgMobile aria-hidden />
                <HeroImgDesktop src={group} alt="Let’s Play Star 團隊合照" />
              </Hero>

              <Info>
                <Row>
                  <Label>成立於</Label>
                  <Value>2020/12/15</Value>
                </Row>
                <Row>
                  <Label>召集人</Label>
                  <Value>
                    Hero 戴祖雄 & 阿寬教練 郭則寬
                  </Value>
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
                    <Icon src={img1} alt="" aria-hidden />
                    <IconTitle>推廣桌球・提升全民風氣</IconTitle>
                  </IconCard>
                  <IconCard>
                    <Icon src={img2} alt="" aria-hidden />
                    <IconTitle>公益桌球賽</IconTitle>
                  </IconCard>
                </IconRow>
              </Info>
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default LetsPlayStar;
