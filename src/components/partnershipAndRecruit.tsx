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

const SectionBg = styled.div`
  width: 100%;
  background: ${theme.colors.primary};
  position: relative;
  overflow: hidden;
`;

const Bg = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.75;
  background:
    radial-gradient(circle at 18% 22%, rgba(42, 210, 105, 0.16) 0 240px, rgba(42, 210, 105, 0) 520px),
    radial-gradient(circle at 82% 30%, rgba(242, 183, 43, 0.18) 0 220px, rgba(242, 183, 43, 0) 520px),
    radial-gradient(circle at 12% 78%, rgba(255, 255, 255, 0.52) 0 6px, rgba(255, 255, 255, 0) 7px),
    radial-gradient(circle at 24% 66%, rgba(255, 255, 255, 0.42) 0 5px, rgba(255, 255, 255, 0) 6px),
    radial-gradient(circle at 76% 78%, rgba(255, 255, 255, 0.44) 0 5px, rgba(255, 255, 255, 0) 6px);
  background-repeat: no-repeat;
  background-size: cover;
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

const BigItem = () => {
  const { ref, inView } = useInViewOnce<HTMLParagraphElement>({ rootMargin: "0px 0px -12% 0px", threshold: 0.18 });
  return (
    <Big ref={ref} data-inview={inView} style={{ opacity: inView ? 1 : 0, transition: "opacity 240ms ease" }}>
      目前已超過 <Number>30</Number> 個合作機構
      <br />
      企業機構、法人團體熱烈招募合作中！
    </Big>
  );
};

const CategoryItem = ({ c, idx }: { c: Category; idx: number }) => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  return (
    <Block ref={ref} data-inview={inView} style={{ animationDelay: `${idx * 90}ms` }}>
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
  );
};

const PartnershipAndRecruit = () => {
  return (
    <PageContainer id="partnershipAndRecruit">
      <SectionBg>
        <Bg aria-hidden="true" />
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <WhiteTitle>合作與招募</WhiteTitle>
              <WhiteSubtitle>Partnership & Recruit</WhiteSubtitle>
            </TitleGroup>

            <BigItem />

            <Grid>
              {CATEGORIES.map((c, idx) => (
                <CategoryItem key={c.title} c={c} idx={idx} />
              ))}
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default PartnershipAndRecruit;
