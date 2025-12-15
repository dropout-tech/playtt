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

const WhiteTitle = styled(SectionTitle)`
  color: ${theme.colors.background};
`;

const WhiteSubtitle = styled(SectionSubtitle)`
  color: ${theme.colors.textMuted};
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
            <TitleGroup>
              <WhiteTitle>合作與招募</WhiteTitle>
              <WhiteSubtitle>Partnership & Recruit</WhiteSubtitle>
            </TitleGroup>

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
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default PartnershipAndRecruit;
