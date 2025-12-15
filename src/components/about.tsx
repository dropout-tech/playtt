import React from "react";
import styled, { css, keyframes } from "styled-components";
import {
  PageContainer,
  Container,
  ContentWrapper,
  SectionTitle,
  SectionSubtitle,
  TitleGroup,
  ContentTitle,
  ContentSubtitle,
  BodyText,
  BoldText,
  Card,
} from "../styles/components";
import { theme, media } from "../styles/theme";
import about1 from "../assets/about/about1.png";
import about2 from "../assets/about/about2.png";
import about3 from "../assets/about/about3.png";
import about1m from "../assets/about/about1-m.png";
import about2m from "../assets/about/about2-m.png";
import about3m from "../assets/about/about3-m.png";

// 內容資料（數據驅動，易於維護）
const aboutContent = [
  {
    id: 1,
    title: "我們的夢想",
    subtitle: "Let's Play Dream",
    image: about1,
    mobileImage: about1m,
    paragraphs: [
      "我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 Let's Play !",
      "感受發自內心的快樂，一起來玩吧！",
    ],
  },
  {
    id: 2,
    title: "我們的故事",
    subtitle: "Let's Play Story",
    image: about2,
    mobileImage: about2m,
    paragraphs: [
      "Let's Play ! 創立於 2018 年，創辦人阿寬教練畢業於桌球名校麗山國中與松山家商，大學時期深受林學宜教授的啟發，非常懂得職業球員訓練的辛苦，但他其實更想分享給大家的是，如何和大家快樂的「玩」桌球！孩子可以培養信心與專注力、上班族可以釋放壓力、年長者可以擁有豐富退休生活的樂趣！",
      "此外，從桌球同業的夥伴聯盟合作與跨領域的異業結合，到建立桌球教練創業輔導的平台，甚至邀請名人一起玩桌球，越來越多的創意可能性等著我們去實現！",
      "Let's Play ! 運動 X 創新，邀請大家一起來玩！",
    ],
  },
  {
    id: 3,
    title: "教學理念",
    subtitle: "Let's Play Teach",
    image: about3,
    mobileImage: about3m,
    paragraphs: [
      "學習桌球除了提升球技，我們希望參與課程和遊戲的你們，一起養成良好的運動習慣、多一種社交方式，甚至可以獲得更多生命中的禮物：如運動家精神、人生體悟、品性培養、歡笑與汗水的美好回憶。",
      "Let's Play ! 希望打破大家對桌球的認知，根據不同水平慢慢引導，用簡單的口訣在輕鬆的氣氛中自然而然地上手。原來，桌球一點也不難；原來，桌球可以在玩樂中學習成長！",
    ],
  },
];

const FuturaSpan = styled.span`
  font-family: ${theme.fonts.secondary};
`;

// 格式化文字，將特定文字包裝為 Futura 字體
const formatText = (text: string) => {
  const parts = text.split(/(Let's Play !|2018|X)/);
  return parts.map((part, index) => {
    if (part === "Let's Play !" || part === "2018" || part === "X") {
      return <FuturaSpan key={index}>{part}</FuturaSpan>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

// ============================================
// 大膽的「玩」：背景/動效（但可控 + respects reduced-motion）
// ============================================

const popIn = keyframes`
  0% { opacity: 0; transform: translateY(14px) scale(0.98); }
  60% { opacity: 1; transform: translateY(-2px) scale(1.01); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const floatBall = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -10px, 0); }
`;

const drift = keyframes`
  0% { transform: translate3d(-6%, -2%, 0) rotate(-3deg); opacity: 0.55; }
  50% { transform: translate3d(2%, 2%, 0) rotate(2deg); opacity: 0.75; }
  100% { transform: translate3d(6%, -1%, 0) rotate(-2deg); opacity: 0.6; }
`;

const SectionShell = styled(PageContainer)`
  position: relative;
  overflow: hidden;
`;

const Bg = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: ${theme.borderRadius.full};
    filter: blur(0.2px);
    opacity: 0.6;
    animation: ${drift} 9.5s ease-in-out infinite;
  }

  /* 大顆漸層球（像桌球的光澤感） */
  &::before {
    width: 560px;
    height: 560px;
    right: -220px;
    top: -220px;
    background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.85) 0 16%, rgba(255, 255, 255, 0) 30%),
      linear-gradient(135deg, rgba(42, 210, 105, 0.42) 0%, rgba(242, 183, 43, 0.38) 100%);
  }

  /* 散落小球點點（更「玩」） */
  &::after {
    width: 760px;
    height: 420px;
    left: -260px;
    bottom: -200px;
    background-image:
      radial-gradient(circle at 12% 20%, rgba(255, 255, 255, 0.70) 0 6px, rgba(255, 255, 255, 0) 7px),
      radial-gradient(circle at 22% 72%, rgba(255, 255, 255, 0.65) 0 5px, rgba(255, 255, 255, 0) 6px),
      radial-gradient(circle at 42% 34%, rgba(255, 255, 255, 0.55) 0 4px, rgba(255, 255, 255, 0) 5px),
      radial-gradient(circle at 58% 66%, rgba(255, 255, 255, 0.55) 0 4px, rgba(255, 255, 255, 0) 5px),
      radial-gradient(circle at 76% 26%, rgba(255, 255, 255, 0.60) 0 5px, rgba(255, 255, 255, 0) 6px),
      radial-gradient(circle at 86% 74%, rgba(255, 255, 255, 0.50) 0 4px, rgba(255, 255, 255, 0) 5px);
    background-repeat: no-repeat;
    background-size: cover;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      animation: none;
    }
  }
`;

const AboutWrapper = styled(ContentWrapper)`
  position: relative;
  z-index: 1;
`;

const Rows = styled.div`
  margin-top: ${theme.spacing.xxl};

  ${media.tablet} {
    margin-top: ${theme.spacing.xl};
  }
`;

const Row = styled.section<{ $reverse?: boolean }>`
  display: grid;
  grid-template-columns: minmax(260px, 360px) 1fr;
  grid-template-areas: "media text";
  gap: 36px;
  align-items: center;
  margin-top: 54px;
  animation: ${popIn} 700ms cubic-bezier(0.2, 0.9, 0.2, 1) both;

  ${props =>
    props.$reverse &&
    css`
      grid-template-areas: "text media";
    `}

  ${media.tablet} {
    grid-template-columns: 1fr;
    grid-template-areas:
      "media"
      "text";
    gap: 16px;
    margin-top: 26px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MediaCard = styled(Card)`
  grid-area: media;
  position: relative;
  padding: 10px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.90) 100%);

  /* 讓圖片卡更「彈」 */
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 220ms ease;

  &::before {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: 22px;
    background: linear-gradient(135deg, rgba(42, 210, 105, 0.55), rgba(242, 183, 43, 0.55));
    opacity: 0.35;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-6px) rotate(-0.6deg) scale(1.01);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

const MediaInner = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: ${theme.colors.background};
`;

const Img = styled.img`
  width: 100%;
  height: auto;
  display: block;
  transform: translateZ(0);
  transition: transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1);

  ${MediaCard}:hover & {
    transform: scale(1.04);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    ${MediaCard}:hover & {
      transform: none;
    }
  }
`;

const Ball = styled.div<{ $size: number; $x: string; $y: string; $delay: string; $opacity: number }>`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  left: ${props => props.$x};
  top: ${props => props.$y};
  border-radius: ${theme.borderRadius.full};
  background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.95) 0 28%, rgba(255, 255, 255, 0.25) 45%, rgba(255, 255, 255, 0.06) 60%, rgba(255, 255, 255, 0) 72%),
    linear-gradient(135deg, rgba(42, 210, 105, 0.18) 0%, rgba(242, 183, 43, 0.16) 100%);
  box-shadow: 0 10px 22px rgba(26, 26, 26, 0.10);
  opacity: ${props => props.$opacity};
  animation: ${floatBall} 2.9s ease-in-out infinite;
  animation-delay: ${props => props.$delay};
  pointer-events: none;
  mix-blend-mode: soft-light;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const TextCard = styled(Card)`
  grid-area: text;
  padding: 22px 22px 20px;
  border-radius: 20px;
  position: relative;

  /* 一點「貼紙」感 */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: radial-gradient(circle at 12% 10%, rgba(42, 210, 105, 0.10) 0 22%, rgba(42, 210, 105, 0) 45%),
      radial-gradient(circle at 92% 84%, rgba(242, 183, 43, 0.10) 0 26%, rgba(242, 183, 43, 0) 52%);
    pointer-events: none;
  }

  ${media.tablet} {
    padding: 16px 16px 14px;
  }
`;

const Sticker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(26, 26, 26, 0.06);
  color: ${theme.colors.textMuted};
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  letter-spacing: 0.08em;
  font-size: 13px;
  margin-bottom: 10px;

  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: ${theme.borderRadius.full};
    background: ${theme.colors.secondary};
    box-shadow: 0 6px 14px rgba(242, 183, 43, 0.25);
  }
`;

const About = () => {
  return (
    <SectionShell id="about">
      <Bg aria-hidden="true" />
      <Container>
        <AboutWrapper>
          <TitleGroup>
            <SectionTitle>關於我們</SectionTitle>
            <SectionSubtitle>About Us</SectionSubtitle>
          </TitleGroup>

          <Rows>
            {aboutContent.map((content, idx) => (
              <Row key={content.id} $reverse={idx % 2 === 1} style={{ animationDelay: `${idx * 120}ms` }}>
                <MediaCard>
                  <MediaInner>
                    <picture>
                      <source media="(max-width: 768px)" srcSet={content.mobileImage} />
                      <Img src={content.image} alt={content.title} loading="lazy" />
                    </picture>
                    <Ball $size={64} $x="8%" $y="12%" $delay={`${idx * 0.08}s`} $opacity={0.52} />
                    <Ball $size={42} $x="76%" $y="14%" $delay={`${0.6 + idx * 0.06}s`} $opacity={0.42} />
                    <Ball $size={54} $x="62%" $y="72%" $delay={`${1.05 + idx * 0.05}s`} $opacity={0.36} />
                  </MediaInner>
                </MediaCard>

                <TextCard>
                  <Sticker>{content.subtitle}</Sticker>
                  <ContentTitle>{content.title}</ContentTitle>
                  <ContentSubtitle>Let’s Play</ContentSubtitle>
                  {content.paragraphs.map((paragraph, pIdx) => {
                    const isLastBold = pIdx === content.paragraphs.length - 1 && paragraph.length < 50;
                    const TextComponent = isLastBold ? BoldText : BodyText;
                    return <TextComponent key={pIdx}>{formatText(paragraph)}</TextComponent>;
                  })}
                </TextCard>
              </Row>
            ))}
          </Rows>
        </AboutWrapper>
      </Container>
    </SectionShell>
  );
};

export default About;
