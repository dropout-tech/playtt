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

const FeatureImage = styled.img`
  width: 100%;
  aspect-ratio: 16 / 10;
  height: auto;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(26, 26, 26, 0.12);
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1);

  ${media.tablet} {
    aspect-ratio: 16 / 11;
  }
`;

const FeatureCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
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

  ${media.tablet} {
    padding: ${theme.spacing.md};
  }
`;

const FeatureRow = styled.div<{ reverse?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.md};
  align-items: stretch;
  position: relative;

  /* 預設先隱藏，等進入視窗才播放 */
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.985);

  &[data-inview="true"] {
    animation: ${fadeUp} 680ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

  /* 更大膽的 hover：圖片放大 + 卡片 tilt + 亮面 */
  &:hover ${FeatureImage} {
    transform: scale(1.035);
  }

  &:hover ${FeatureCard} {
    transform: translate3d(0, -6px, 0) rotate(-0.25deg);
    box-shadow: 0 16px 34px rgba(26, 26, 26, 0.16);
    filter: saturate(1.04);
  }

  &:hover ${FeatureCard}::after {
    animation: ${shine} 720ms ease both;
  }

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

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    &[data-inview="true"] {
      animation: none;
    }

    &:hover ${FeatureImage} {
      transform: none;
    }
    &:hover ${FeatureCard} {
      transform: none;
      filter: none;
    }
    &:hover ${FeatureCard}::after {
      animation: none;
    }
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

const FeatureItem = ({ feature, idx }: { feature: Feature; idx: number }) => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  const reverse = idx % 2 === 1;

  return (
    <FeatureRow
      ref={ref}
      data-inview={inView}
      reverse={reverse}
      style={{ animationDelay: `${idx * 90}ms` }}
    >
      <FeatureImage src={feature.imageSrc} alt={feature.title} loading="lazy" />
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
  );
};

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
                <FeatureItem key={feature.title} feature={feature} idx={idx} />
              ))}
            </FeatureList>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default Classes;
