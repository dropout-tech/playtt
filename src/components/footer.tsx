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
  padding: ${theme.spacing.xxl} ${theme.spacing.md} ${theme.spacing.lg};

  ${media.tablet} {
    padding: ${theme.spacing.xl} ${theme.spacing.sm} ${theme.spacing.md};
  }
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${theme.spacing.lg};
  align-items: end;

  ${media.tablet} {
    grid-template-columns: 1fr;
    align-items: start;
    gap: ${theme.spacing.md};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxxl};
  line-height: 52px;
  letter-spacing: 0.04em;
  color: ${theme.colors.background};

  ${media.tablet} {
    font-size: ${theme.fontSize.xxl};
    line-height: 40px;
  }
`;

const Subtitle = styled.p`
  margin: 6px 0 0;
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.xxxl};
  line-height: 52px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.72);

  ${media.tablet} {
    font-size: ${theme.fontSize.xxl};
    line-height: 40px;
  }
`;

const Hint = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.88);
  max-width: 720px;
`;

const FooterButton = styled(PrimaryButton)`
  width: 280px;
  height: 56px;
  border-radius: 12px;

  ${media.tablet} {
    width: 100%;
    height: 52px;
  }
`;

const FooterButtonText = styled(ButtonText)`
  font-size: ${theme.fontSize.lg};
  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
  }
`;

const Divider = styled.div`
  margin-top: ${theme.spacing.lg};
  height: 1px;
  width: 100%;
  background: rgba(255, 255, 255, 0.18);
`;

const Grid = styled.div`
  margin-top: ${theme.spacing.lg};
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${theme.spacing.md};

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const Card = styled.section`
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  padding: ${theme.spacing.md};
  min-width: 0;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxl};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.background};

  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
    line-height: 28px;
  }
`;

const CardSubtitle = styled.p`
  margin: 6px 0 0;
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.md};
  line-height: 24px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.72);
`;

const List = styled.div`
  margin-top: ${theme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px;

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
  font-size: ${theme.fontSize.md};
  line-height: 28px;
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

const BottomRow = styled.div`
  margin-top: ${theme.spacing.lg};
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;

  ${media.tablet} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Copyright = styled.div`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.sm};
  line-height: 24px;
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
              <Hint>預約體驗、課程諮詢、場地與合作需求，歡迎直接透過 Line / 電話與我們聯繫。</Hint>
            </div>

            <FooterButton
              onClick={() => {
                window.open("https://www.facebook.com/playpp2018", "_parent");
              }}
            >
              <FooterButtonText>立即預約免費試上</FooterButtonText>
            </FooterButton>
          </HeaderRow>

          <Divider />

          <Grid>
            {cards.map((card) => (
              <Card key={card.title}>
                <CardTitle>{card.title}</CardTitle>
                <CardSubtitle>{card.subtitle}</CardSubtitle>
                <List>
                  {card.items.map((item) => (
                    <Row key={`${card.title}-${item.label}`}>
                      <Label>{item.label}</Label>
                      <Value>{item.value}</Value>
                    </Row>
                  ))}
                </List>
              </Card>
            ))}
          </Grid>

          <BottomRow>
            <Copyright>Copyright © 2026 Let's Play</Copyright>
          </BottomRow>
        </Inner>
      </FooterBg>
    </PageContainer>
  );
};

export default Footer;

