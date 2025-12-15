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

import img1 from "../assets/otherService/img1.png";
import img2 from "../assets/otherService/img2.png";
import img3 from "../assets/otherService/img3.png";
import img4 from "../assets/otherService/img4.png";
import img5 from "../assets/otherService/img5.png";
import img6 from "../assets/otherService/img6.png";

type Service = {
  title: React.ReactNode;
  description: React.ReactNode;
  iconSrc: string;
};

const Em = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: theme.fonts.secondary, fontWeight: theme.fontWeight.bold }}>{children}</span>
);

const SERVICES: Service[] = [
  {
    title: "桌球俱樂部",
    description: (
      <>
        合作機構：華江高中
        <br />
        聚集桌球愛好打手
        <br />
        舉辦活動分享知識增加凝聚力
      </>
    ),
    iconSrc: img1,
  },
  {
    title: "場地租借",
    description: (
      <>
        平日上午包場優惠
        <br />
        歡迎洽談，提早預約
        <br />
        平日 <Em>14:00–21:00</Em> 與周末租桌服務
      </>
    ),
    iconSrc: img2,
  },
  {
    title: "球具販售",
    description: (
      <>
        依據需求協助搭配和製作球具，
        <br />
        以達到學習和運動成效為主要目的。
      </>
    ),
    iconSrc: img3,
  },
  {
    title: "場館加盟與聯盟合作",
    description: (
      <>
        提供系統化的 <Em>SOP</Em> 協助桌球產業發展更全面，
        <br />
        並且共享產業資源互利，提供有心推廣桌球的同業更好的機會。
      </>
    ),
    iconSrc: img4,
  },
  {
    title: "趣味活動",
    description: (
      <>
        桌球結合趣味競賽
        <br />
        各式行銷活動協辦
        <br />
        自媒體 / 媒體合作
      </>
    ),
    iconSrc: img5,
  },
  {
    title: (
      <>
        <Em>VIP</Em> 專區
      </>
    ),
    description: (
      <>
        特別精心打造的桌球 <Em>VIP</Em> 包廂空間，
        <br />
        讓玩樂和歡笑回憶留在美好的空間，更方便拍照留念。
        <br />
        目標成為雙北桌球跨足休閒娛樂的業界首選，開創桌球產業藍海。
      </>
    ),
    iconSrc: img6,
  },
];

const SectionBg = styled.div`
  width: 100%;
  background: ${theme.colors.background};
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

const fadeUp = keyframes`
  0% { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.985); }
  60% { opacity: 1; transform: translate3d(0, -2px, 0) scale(1.01); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
`;

const wiggle = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
  75% { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
`;

const shine = keyframes`
  0% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
  30% { opacity: 0.55; }
  70% { opacity: 0.18; }
  100% { transform: translateX(220%) skewX(-12deg); opacity: 0; }
`;

const iconPop = keyframes`
  0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
  35% { transform: translate3d(0, -4px, 0) scale(1.06) rotate(-6deg); }
  70% { transform: translate3d(0, 0, 0) scale(1.02) rotate(6deg); }
  100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
`;

const ServiceCard = styled(Card)`
  position: relative;
  padding: ${theme.spacing.lg};
  background: rgba(207, 210, 211, 0.2);
  overflow: hidden;

  /* 解掉「圖示壓到文字」：改成 2 欄版面 */
  display: grid;
  grid-template-columns: 1fr 132px;
  grid-template-areas:
    "title icon"
    "desc  icon";
  column-gap: 18px;
  row-gap: 10px;
  align-items: start;

  /* 預設先隱藏，等進入視窗才播放 */
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.985);

  &[data-inview="true"] {
    animation: ${fadeUp} 640ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  }

  /* 更大膽的 hover：tilt + 亮面掃過 */
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
    grid-template-columns: 1fr;
    grid-template-areas:
      "title"
      "desc"
      "icon";
    row-gap: 12px;
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    &[data-inview="true"] {
      animation: none;
    }
  }
`;

const ServiceTitle = styled.h3`
  margin: 0;
  grid-area: title;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxl};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.text};

  ${media.tablet} {
    font-size: 20px;
    line-height: 28px;
  }
`;

const ServiceDesc = styled.p`
  margin: 0;
  grid-area: desc;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  letter-spacing: 0.03em;
  color: ${theme.colors.text};
  padding-right: 6px;
`;

const IconWrap = styled.div`
  grid-area: icon;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;

  ${media.tablet} {
    justify-content: flex-start;
    align-items: center;
  }
`;

const Icon = styled.img`
  width: 112px;
  height: 112px;
  object-fit: contain;
  transform-origin: 70% 70%;
  filter: drop-shadow(0 10px 18px rgba(26, 26, 26, 0.12));

  ${media.tablet} {
    width: 96px;
    height: 96px;
  }
`;

const MotionCard = styled(ServiceCard)`
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 220ms ease, filter 220ms ease;

  &:hover {
    transform: translate3d(0, -6px, 0) rotate(-0.35deg);
    box-shadow: 0 16px 34px rgba(26, 26, 26, 0.16);
    filter: saturate(1.04);
  }

  &:hover::after {
    animation: ${shine} 720ms ease both;
  }

  &:hover ${Icon} {
    animation: ${iconPop} 520ms ease-in-out, ${wiggle} 520ms ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
      filter: none;
    }
    &:hover::after {
      animation: none;
    }
    &:hover ${Icon} {
      animation: none;
    }
  }
`;

const ServiceItem = ({ s, idx }: { s: Service; idx: number }) => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ rootMargin: "0px 0px -8% 0px", threshold: 0.18 });

  return (
    <MotionCard ref={ref} data-inview={inView} style={{ animationDelay: `${idx * 90}ms` }}>
      <ServiceTitle>{s.title}</ServiceTitle>
      <ServiceDesc>{s.description}</ServiceDesc>
      <IconWrap>
        <Icon src={s.iconSrc} alt="" aria-hidden />
      </IconWrap>
    </MotionCard>
  );
};

const OtherService = () => {
  return (
    <PageContainer id="otherService">
      <SectionBg>
        <Container>
          <ContentWrapper>
            <TitleGroup>
              <SectionTitle>其他服務</SectionTitle>
              <SectionSubtitle>Other Service</SectionSubtitle>
            </TitleGroup>

            <Grid>
              {SERVICES.map((s, idx) => (
                <ServiceItem key={idx} s={s} idx={idx} />
              ))}
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default OtherService;
