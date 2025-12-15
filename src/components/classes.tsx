import React from "react";
import styled from "styled-components";
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

import img1 from "../assets/classes/img1.png";
import img2 from "../assets/classes/img2.png";
import img3 from "../assets/classes/img3.png";

type Feature = {
  title: string;
  imageSrc: string;
  bullets: string[];
};

const FEATURES: Feature[] = [
  {
    title: "班別課程豐富客製化",
    imageSrc: img1,
    bullets: [
      "個人班 / 團體班 / 選手班 / 親子 / 包班",
      "幼兒 / 兒童 / 國高中 / 大學 / 成人 / 銀髮",
      "小班客製化教學 / 大班休閒娛樂教學",
      "冬令營 / 夏令營（搭配多元才藝合作）",
    ],
  },
  {
    title: "寓教於樂多元發展",
    imageSrc: img2,
    bullets: [
      "暖身做操 & 趣味體適能桌球",
      "互動遊戲式球感",
      "對打練習",
      "互動單球調整揮拍動作",
      "遊戲競賽",
      "球技 / 學習態度 / 品性 / 運動家精神 / 獲得體悟",
    ],
  },
  {
    title: "伴你一生的全年齡運動",
    imageSrc: img3,
    bullets: [
      "培養專注力 / 耐挫力 / 肌耐力 / 體能",
      "肢體協調 / 遠離 3C",
      "兒童腦部發育 / 成人腦部健全發展",
      "培養良好運動習慣與社交能力",
      "預防老人智力退化",
    ],
  },
];

const SectionBg = styled.div`
  width: 100%;
  background: ${theme.colors.background};
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};

  ${media.tablet} {
    gap: ${theme.spacing.md};
  }
`;

const FeatureRow = styled.div<{ reverse?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.md};
  align-items: stretch;

  ${media.tablet} {
    grid-template-columns: 1fr;
  }

  ${props =>
    props.reverse
      ? `
    & > :first-child { order: 2; }
    & > :last-child { order: 1; }
    ${media.tablet} {
      & > :first-child { order: 1; }
      & > :last-child { order: 2; }
    }
  `
      : ""}
`;

const FeatureImage = styled.img`
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(26, 26, 26, 0.12);

  ${media.tablet} {
    max-height: 260px;
  }
`;

const FeatureCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${theme.spacing.lg};

  ${media.tablet} {
    padding: ${theme.spacing.md};
  }
`;

const Pill = styled.div`
  align-self: flex-start;
  background: ${theme.colors.secondary};
  border-radius: 28px;
  padding: 10px 16px;
  box-shadow: 0 4px 20px rgba(26, 26, 26, 0.07);

  ${media.tablet} {
    border-radius: 24px;
    padding: 8px 14px;
  }
`;

const PillTitle = styled.h3`
  margin: 0;
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

const BulletList = styled.ul`
  margin: ${theme.spacing.md} 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BulletItem = styled.li`
  display: flex;
  gap: 10px;
  align-items: flex-start;
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

  &::before {
    content: "・";
    color: ${theme.colors.textMuted};
    flex: 0 0 auto;
    margin-top: -1px;
  }
`;

const Classes = () => {
  return (
    <PageContainer id="classes">
      <SectionBg>
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>課程介紹</SectionTitle>
              <SectionSubtitle>Our Course</SectionSubtitle>
            </TitleGroup>

            <FeatureList>
              {FEATURES.map((feature, idx) => (
                <FeatureRow key={feature.title} reverse={idx % 2 === 1}>
                  <FeatureImage src={feature.imageSrc} alt={feature.title} />
                  <FeatureCard>
                    <Pill>
                      <PillTitle>{feature.title}</PillTitle>
                    </Pill>
                    <BulletList>
                      {feature.bullets.map((b) => (
                        <BulletItem key={`${feature.title}-${b}`}>{b}</BulletItem>
                      ))}
                    </BulletList>
                  </FeatureCard>
                </FeatureRow>
              ))}
            </FeatureList>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default Classes;
