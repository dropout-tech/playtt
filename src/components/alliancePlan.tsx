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
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const SectionBg = styled.div`
  width: 100%;
  background: ${theme.colors.backgroundLight};
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
  animation: ${fadeUp} 520ms ease both;

  ${media.tablet} {
    padding: ${theme.spacing.md};
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

const AlliancePlan = () => {
  return (
    <PageContainer id="alliancePlan">
      <SectionBg>
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>聯盟計畫</SectionTitle>
              <SectionSubtitle>Alliance</SectionSubtitle>
            </TitleGroup>

            <Grid>
              {BLOCKS.map((b, idx) => (
                <BlockCard key={b.title} style={{ animationDelay: `${idx * 90}ms` }}>
                  <IconRow>
                    <Icon src={b.iconSrc} alt="" aria-hidden />
                    <BlockTitle>{b.title}</BlockTitle>
                  </IconRow>
                  <Body>{b.content}</Body>
                </BlockCard>
              ))}
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default AlliancePlan;
