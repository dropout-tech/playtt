import React from "react";
import styled from "styled-components";
import { ButtonText, PageContainer, PrimaryButton } from "../styles/components";
import { media, theme } from "../styles/theme";

type ContactItem = {
  label: string;
  value: React.ReactNode;
};

const FooterBg = styled.footer`
  width: 100%;
  background: ${theme.colors.primary};
  color: ${theme.colors.background};
`;

const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  /* 讓 Footer 更緊湊：避免超出一整個螢幕高度 */
  padding: ${theme.spacing.lg} ${theme.spacing.md} ${theme.spacing.md};

  ${media.tablet} {
    padding: ${theme.spacing.md} ${theme.spacing.sm};
  }
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: ${theme.spacing.md};
  align-items: center;

  ${media.tablet} {
    grid-template-columns: 1fr;
    align-items: stretch;
    gap: ${theme.spacing.sm};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxl};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.background};

  ${media.tablet} {
    font-size: ${theme.fontSize.xxl};
    line-height: 32px;
  }
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.lg};
  line-height: 28px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.72);

  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
    line-height: 28px;
  }
`;

const FooterButton = styled(PrimaryButton)`
  width: 100%;
  height: 52px;
  border-radius: 12px;

  ${media.tablet} {
    width: 100%;
    height: 48px;
  }
`;

const FooterButtonText = styled(ButtonText)`
  font-size: ${theme.fontSize.lg};
`;

const Grid = styled.div`
  margin-top: ${theme.spacing.md};
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${theme.spacing.md};

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const Section = styled.section`
  min-width: 0;
  padding-top: 2px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.lg};
  line-height: 26px;
  letter-spacing: 0.04em;
  color: ${theme.colors.background};

  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
    line-height: 26px;
  }
`;

const SectionSubtitle = styled.p`
  margin: 4px 0 0;
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.sm};
  line-height: 22px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.72);
`;

const List = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 8px;

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: 4px;
  }
`;

const Label = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.sm};
  line-height: 22px;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.82);
`;

const Value = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.sm};
  line-height: 24px;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.96);
  word-break: break-word;
`;

const Link = styled.a`
  color: ${theme.colors.secondary};
  text-decoration: none;
  font-weight: ${theme.fontWeight.bold};

  &:hover {
    text-decoration: underline;
  }
`;

const Copyright = styled.div`
  margin-top: ${theme.spacing.md};
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.normal};
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.72);
`;

function getFooterCards(): { title: string; subtitle: string; items: ContactItem[] }[] {
  const lineUrl = "https://line.me/R/ti/p/@869usyqy";
  return [
    {
      title: "聯絡資訊",
      subtitle: "Head Office",
      items: [
        { label: "地址", value: "新北市蘆洲區長樂路106號3樓" },
        {
          label: "Line",
          value: (
            <Link href={lineUrl} target="_blank" rel="noreferrer">
              @869usyqy
            </Link>
          ),
        },
        { label: "電話", value: <Link href="tel:+886282861011">02-8286-1011</Link> },
        { label: "信箱", value: <Link href="mailto:playpp2018@gmail.com">playpp2018@gmail.com</Link> },
        { label: "客服時間", value: "週一至週五 10:00–19:00（週末請撥各館電話）" },
      ],
    },
    {
      title: "據點資訊",
      subtitle: "Locations",
      items: [
        {
          label: "蘆洲店",
          value: (
            <>
              新北市蘆洲區長樂路106號3樓
              <br />
              Line：
              <Link href={lineUrl} target="_blank" rel="noreferrer">
                @869usyqy
              </Link>
              <br />
              電話：<Link href="tel:+886282861011">02-8286-1011</Link>
            </>
          ),
        },
        {
          label: "林口店",
          value: (
            <>
              資訊更新中
              <br />
              請洽 Line：
              <Link href={lineUrl} target="_blank" rel="noreferrer">
                @869usyqy
              </Link>
            </>
          ),
        },
      ],
    },
  ];
}

const Footer = () => {
  const cards = getFooterCards();
  return (
    <PageContainer id="company">
      <FooterBg aria-label="聯絡我們 Footer">
        <Inner>
          <HeaderRow>
            <div>
              <Title>聯絡我們</Title>
              <Subtitle>Contact Us</Subtitle>
            </div>

            <FooterButton
              onClick={() => {
                window.open("https://www.facebook.com/playpp2018", "_parent");
              }}
            >
              <FooterButtonText>立即預約免費試上</FooterButtonText>
            </FooterButton>
          </HeaderRow>

          <Grid>
            {cards.map((card) => (
              <Section key={card.title}>
                <SectionTitle>{card.title}</SectionTitle>
                <SectionSubtitle>{card.subtitle}</SectionSubtitle>
                <List>
                  {card.items.map((item) => (
                    <Row key={`${card.title}-${item.label}`}>
                      <Label>{item.label}</Label>
                      <Value>{item.value}</Value>
                    </Row>
                  ))}
                </List>
              </Section>
            ))}
          </Grid>

          <Copyright>Copyright © 2026 Let's Play</Copyright>
        </Inner>
      </FooterBg>
    </PageContainer>
  );
};

export default Footer;

