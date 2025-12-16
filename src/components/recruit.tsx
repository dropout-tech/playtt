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
  background: ${theme.colors.background};
  position: relative;
  overflow: hidden;
`;

const Decor = styled.div`
  position: absolute;
  right: -180px;
  top: 80px;
  width: 460px;
  height: 260px;
  border-radius: 999px;
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
  opacity: 0.18;
  animation: float 7s ease-in-out infinite;

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  ${media.tablet} {
    right: -220px;
    top: 40px;
    width: 420px;
    height: 240px;
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};
`;

const Banner = styled(Card)`
  background: rgba(207, 210, 211, 0.2);
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

const Pill = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 28px;
  background: ${theme.colors.secondary};
  box-shadow: 0 4px 20px rgba(26, 26, 26, 0.07);
`;

const PillText = styled.div`
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

const List = styled.ul`
  margin: ${theme.spacing.md} 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.li`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  letter-spacing: 0.02em;
  color: ${theme.colors.text};
  display: flex;
  gap: 10px;

  &::before {
    content: "・";
    color: ${theme.colors.textMuted};
    flex: 0 0 auto;
  }
`;

const Recruit = () => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.18 });
  return (
    <PageContainer id="recruit">
      <SectionBg>
        <Decor aria-hidden />
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>合作招募</SectionTitle>
              <SectionSubtitle>Recruit</SectionSubtitle>
            </TitleGroup>

            <Layout>
              <Banner ref={ref} data-inview={inView}>
                <Pill>
                  <PillText>＃ 熱烈招募中！</PillText>
                </Pill>
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
              </Banner>
            </Layout>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default Recruit;
