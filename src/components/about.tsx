import React from "react";
import styled from "styled-components";
import {
  PageContainer,
  DesktopContainer,
  MobileContainer,
  SectionTitle,
  SectionSubtitle,
  ContentTitle,
  ContentSubtitle,
  BodyText,
  BoldText,
} from "../styles/components";
import { theme, media } from "../styles/theme";
import about1 from "../assets/about/about1.png";
import about2 from "../assets/about/about2.png";
import about3 from "../assets/about/about3.png";
import about1m from "../assets/about/about1-m.png";
import about2m from "../assets/about/about2-m.png";
import about3m from "../assets/about/about3-m.png";

// 內容區塊組件（重用）
const ContentBlock = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-left: ${theme.spacing.lg};
  padding-right: ${theme.spacing.lg};
  margin-bottom: 120px;
  margin-top: 200px;

  ${media.desktop} {
    margin-top: 200px;
  }

  ${media.tablet} {
    flex-direction: column;
    margin-bottom: ${theme.spacing.xxl};
    margin-top: 0;
  }
`;

const ContentImage = styled.img`
  width: 207px;
  height: 370px;
  margin-right: 103px;

  ${media.tablet} {
    width: 100%;
    height: auto;
    margin-right: 0;
    margin-bottom: ${theme.spacing.md};
  }
`;

const ContentTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 680px;

  ${media.tablet} {
    width: 100%;
  }
`;

const MobileContentImage = styled.img`
  width: 100%;
  margin-bottom: ${theme.spacing.md};
`;

const MobileContentBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-left: ${theme.spacing.lg};
  padding-right: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xxl};
`;

const TitleGroupWrapper = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-bottom: 100px;

  ${media.tablet} {
    margin-bottom: 60px;
  }
`;


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

const About = () => {
  return (
    <PageContainer id="about">
      {/* 桌面版 */}
      <DesktopContainer>
        <TitleGroupWrapper>
          <SectionTitle>關於我們</SectionTitle>
          <SectionSubtitle>About Us</SectionSubtitle>
        </TitleGroupWrapper>

        {aboutContent.map((content) => (
          <ContentBlock key={content.id}>
            <ContentImage src={content.image} alt={content.title} />
            <ContentTextWrapper>
              <ContentTitle>{content.title}</ContentTitle>
              <ContentSubtitle>{content.subtitle}</ContentSubtitle>
              {content.paragraphs.map((paragraph, index) => {
                const isLastBold = index === content.paragraphs.length - 1 && paragraph.length < 50;
                const TextComponent = isLastBold ? BoldText : BodyText;
                
                return (
                  <TextComponent key={index}>
                    {formatText(paragraph)}
                  </TextComponent>
                );
              })}
            </ContentTextWrapper>
          </ContentBlock>
        ))}
      </DesktopContainer>

      {/* 移動版 */}
      <MobileContainer>
        <TitleGroupWrapper>
          <SectionTitle>關於我們</SectionTitle>
          <SectionSubtitle>About Us</SectionSubtitle>
        </TitleGroupWrapper>

        {aboutContent.map((content) => (
          <MobileContentBlock key={content.id}>
            <MobileContentImage src={content.mobileImage} alt={content.title} />
            <ContentTextWrapper>
              <ContentTitle>{content.title}</ContentTitle>
              <ContentSubtitle>{content.subtitle}</ContentSubtitle>
              {content.paragraphs.map((paragraph, index) => {
                const isLastBold = index === content.paragraphs.length - 1 && paragraph.length < 50;
                const TextComponent = isLastBold ? BoldText : BodyText;
                
                return (
                  <TextComponent key={index}>
                    {formatText(paragraph)}
                  </TextComponent>
                );
              })}
            </ContentTextWrapper>
          </MobileContentBlock>
        ))}
      </MobileContainer>
    </PageContainer>
  );
};

export default About;
