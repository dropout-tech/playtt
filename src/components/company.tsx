import React from "react";
import styled from "styled-components";
import {
  PageContainer,
  SectionTitle,
  SectionSubtitle,
  TitleGroup,
} from "../styles/components";
import { media, theme } from "../styles/theme";

type InfoRow = {
  label: string;
  value: React.ReactNode;
};

type InfoCardData = {
  title: string;
  subtitle?: string;
  rows: InfoRow[];
};

const Outer = styled.div`
  width: 100%;
  background: ${theme.colors.accent};
`;

const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${theme.spacing.xxl} ${theme.spacing.md};

  ${media.tablet} {
    padding: ${theme.spacing.xl} ${theme.spacing.sm};
  }
`;

const HeaderArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Title = styled(SectionTitle)`
  color: ${theme.colors.text};
`;

const Subtitle = styled(SectionSubtitle)`
  color: ${theme.colors.textMuted};
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

const Card = styled.section`
  background: ${theme.colors.background};
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(26, 26, 26, 0.12);
  overflow: hidden;
  min-width: 0;
`;

const CardHeader = styled.div`
  background: ${theme.colors.backgroundLight};
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CardTitle = styled.h3`
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

const CardSubtitle = styled.p`
  margin: 0;
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.md};
  line-height: 24px;
  letter-spacing: 0.04em;
  color: ${theme.colors.textMuted};
`;

const CardBody = styled.div`
  padding: 18px;
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px;

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

const Label = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.sm};
  line-height: 22px;
  letter-spacing: 0.06em;
  color: ${theme.colors.primary};
`;

const Value = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  letter-spacing: 0.02em;
  color: ${theme.colors.text};
  word-break: break-word;
`;

const Link = styled.a`
  color: ${theme.colors.primary};
  text-decoration: none;
  font-weight: ${theme.fontWeight.bold};

  &:hover {
    text-decoration: underline;
  }
`;

function getContactCards(): InfoCardData[] {
  const lineUrl = "https://line.me/R/ti/p/@869usyqy";

  return [
    {
      title: "＃ 總公司",
      subtitle: "Head Office",
      rows: [
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
        { label: "創辦人 / 總教練", value: "郭則寬（阿寬）" },
      ],
    },
    {
      title: "＃ 據點資訊",
      subtitle: "Locations",
      rows: [
        {
          label: "蘆洲店營業時間",
          value: (
            <>
              週一至週五 13:00–21:00（會視課程狀況開店與關店；周一二課程較少會視情況調整；部分早上有開早鳥班）
              <br />
              週六日 9:00–18:00（視情況提早和延後開關店）
            </>
          ),
        },
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

const Company = () => {
  const cards = getContactCards();
  return (
    <PageContainer id="company">
      <Outer>
        <Inner>
          <HeaderArea>
            <TitleGroup>
              <Title>聯絡我們</Title>
              <Subtitle>Contact Us</Subtitle>
            </TitleGroup>
          </HeaderArea>

          <Grid>
            {cards.map((card) => (
              <Card key={card.title}>
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                  {card.subtitle ? <CardSubtitle>{card.subtitle}</CardSubtitle> : null}
                </CardHeader>
                <CardBody>
                  <Rows>
                    {card.rows.map((row) => (
                      <Row key={`${card.title}-${row.label}`}>
                        <Label>{row.label}</Label>
                        <Value>{row.value}</Value>
                      </Row>
                    ))}
                  </Rows>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Inner>
      </Outer>
    </PageContainer>
  );
};

export default Company;
