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

const ServiceCard = styled(Card)`
  position: relative;
  padding: ${theme.spacing.lg};
  background: rgba(207, 210, 211, 0.2);

  ${media.tablet} {
    padding: ${theme.spacing.md};
  }
`;

const ServiceTitle = styled.h3`
  margin: 0;
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
  margin: ${theme.spacing.sm} 0 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  letter-spacing: 0.03em;
  color: ${theme.colors.text};
`;

const Icon = styled.img`
  width: 120px;
  height: 120px;
  object-fit: contain;
  position: absolute;
  right: ${theme.spacing.md};
  bottom: ${theme.spacing.md};

  ${media.tablet} {
    width: 96px;
    height: 96px;
    right: ${theme.spacing.sm};
    bottom: ${theme.spacing.sm};
  }
`;

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
                <ServiceCard key={idx}>
                  <ServiceTitle>{s.title}</ServiceTitle>
                  <ServiceDesc>{s.description}</ServiceDesc>
                  <Icon src={s.iconSrc} alt="" aria-hidden />
                </ServiceCard>
              ))}
            </Grid>
          </ContentWrapper>
        </Container>
      </SectionBg>
    </PageContainer>
  );
};

export default OtherService;
