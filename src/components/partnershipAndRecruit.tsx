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
import SectionHeader from "./common/SectionHeader";
import { media, theme } from "../styles/theme";
import colorLine from "../assets/partnershipAndRecruit/colorLine.png";

type Category = {
  title: string;
  items: string[];
};

const CATEGORIES: Category[] = [
  { title: "運動場館", items: ["舞動陽光", "華江俱樂部", "三峽運動中心", "中正運動中心", "等…"] },
  { title: "學校社團", items: ["大龍國小", "懷生國小", "等…"] },
  { title: "教育機構", items: ["何嘉仁幼兒園", "維多利亞", "喬鈴補習班", "等…"] },
  { title: "桌球場館", items: ["Let’s Play 蘆洲店", "Let’s Play 林口店"] },
];

const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const SectionBg = styled.div`
  width: 100%;
  background: ${theme.colors.primary};
`;



const Big = styled.p`
  margin: ${theme.spacing.lg} 0 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: ${theme.colors.background};
  text-align: center;

  ${media.tablet} {
    font-size: 20px;
    line-height: 34px;
  }
`;

const Number = styled.span`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.secondary};
`;

const Grid = styled.div`
  margin-top: ${theme.spacing.xl};
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${theme.spacing.md};

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const Block = styled(Card)`
  background: rgba(245, 246, 246, 0.96);
  padding: ${theme.spacing.lg};
  animation: ${fadeUp} 520ms ease both;

  ${media.tablet} {
    padding: ${theme.spacing.md};
  }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LineImg = styled.img`
  width: 98px;
  height: 27px;

  ${media.tablet} {
    width: 75px;
    height: 27px;
  }
`;

const CatTitle = styled.h3`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxl};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.text};

  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
    line-height: 28px;
  }
`;

const List = styled.ul`
  margin: ${theme.spacing.md} 0 0;
  padding-left: 18px;
`;

const Item = styled.li`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  letter-spacing: 0.02em;
  color: ${theme.colors.text};
`;

const PartnershipAndRecruit = () => {
  return (
    <PageContainer id="partnershipAndRecruit">
      <SectionBg>
        <Container>
          <ContentWrapper>
            <SectionHeader title="合作與招募" subtitle="Partnership & Recruit" variant="white" />

            <Big>
              目前已超過 <Number>30</Number> 個合作機構
              <br />
              企業機構、法人團體熱烈招募合作中！
            </Big>

            <Grid>
              {CATEGORIES.map((c, idx) => (
                <Block key={c.title} style={{ animationDelay: `${idx * 80}ms` }}>
                  <Head>
                    <LineImg src={colorLine} alt="" aria-hidden />
                    <CatTitle>{c.title}</CatTitle>
                  </Head>
                  <List>
                    {c.items.map((it) => (
                      <Item key={`${c.title}-${it}`}>{it}</Item>
                    ))}
                  </List>
                </Block>
              ))}
            </Grid>

            <Big style={{ marginTop: theme.spacing.xxl }}>
              ＃ 熱烈招募中！
            </Big>

            <Grid style={{ marginTop: theme.spacing.lg }}>
              <Block style={{ gridColumn: '1 / -1' }}>
                <List>
                  <Item>讓雙北小朋友有更完善的學習資源</Item>
                  <Item>推廣桌球讓更多成人共同參與</Item>
                  <Item>除館內課程也提供外派教練進駐服務</Item>
                  <Item>補習班 / 幼兒園 / 學校社團</Item>
                  <Item>家裡 / 運動中心 / 公司社團 / 公家機構</Item>
                  <Item>休閒運動體系創新合作教案（歡樂 / 技術）</Item>
                  <Item>公司福委會競技休閒活動</Item>
                  <Item>期望結合不同類別才藝發展多元課程（街舞、兒童舞蹈、畫畫、音樂等）</Item>
                  <Item>桌球趣味比賽協辦</Item>
                  <Item>乒乓球表演者</Item>
                  <Item>提供桌球產業教練獨特升遷制度</Item>
                </List>
              </Block>
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default PartnershipAndRecruit;
