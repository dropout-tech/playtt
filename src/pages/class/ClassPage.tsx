import React from 'react';
import styled from 'styled-components';
import { theme, media } from '../../styles/theme';
import { Container, ContentWrapper, SectionTitle, BodyText, BoldText, PrimaryButton, ButtonText, Card } from '../../styles/components';
import SectionHeader from '../../components/common/SectionHeader';
import SEO from '../../components/common/SEO';

const PageContainer = styled.div`
  width: 100%;
  background: ${theme.colors.background};
`;

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};
  margin-top: ${theme.spacing.xl};

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

const PriceCard = styled(Card)`
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CategoryTag = styled.div`
  background: ${theme.colors.primary};
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  align-self: flex-start;
  margin-bottom: 16px;
`;

const PriceTitle = styled.h3`
  font-size: 28px;
  margin: 0 0 16px;
  color: ${theme.colors.text};
`;

const PriceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
`;

const PriceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
`;

const Note = styled.p`
  font-size: 14px;
  color: ${theme.colors.textLight};
  margin-top: 20px;
  line-height: 1.6;
`;

const RegisterSection = styled(Container)`
  background: ${theme.colors.backgroundLight};
  margin-top: ${theme.spacing.xxl};
  text-align: center;
`;

const PromoBanner = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
  color: white;
  padding: 40px;
  border-radius: 24px;
  margin-top: ${theme.spacing.xxl};
  text-align: center;
  position: relative;
  overflow: hidden;

  &::after {
    content: "2026";
    position: absolute;
    top: -10px;
    right: -10px;
    font-size: 120px;
    font-weight: 900;
    opacity: 0.1;
  }

  ${media.tablet} {
    padding: 30px 20px;
  }
`;

const PackageCard = styled(PriceCard)`
  background: #FFF9E6;
  border: 2px dashed ${theme.colors.accent};
`;

const ClassPage = () => {
  return (
    <PageContainer>
      <SEO
        title="課程資訊與收費 | Let's Play 桌球聯盟"
        description="最專業的桌球課程規劃，包含兒童/成人團體班、個人一對一培訓、寒暑假營隊以及場地租借。現在預約更享免費試上一堂課。"
      />

      <Container>
        <ContentWrapper>
          <SectionHeader title="課程收費" subtitle="Pricing" />

          <PriceGrid>
            {/* Group Classes */}
            <PriceCard>
              <CategoryTag>團體班 (1.5hr)</CategoryTag>
              <PriceTitle>兒童 / 成人小班制</PriceTitle>
              <PriceList>
                <PriceItem><span>單堂</span> <BoldText>NT$ 600</BoldText></PriceItem>
                <PriceItem><span>5 堂</span> <BoldText>NT$ 2,750</BoldText></PriceItem>
                <PriceItem><span>20 堂 Pack</span> <BoldText>NT$ 10,000</BoldText></PriceItem>
                <PriceItem><span>40 堂 Pack</span> <BoldText>NT$ 18,000</BoldText></PriceItem>
              </PriceList>
              <Note>※ 3-6人小班制。20堂送1堂個人/40堂送2堂個人(加贈三堂團體)。</Note>
            </PriceCard>

            {/* Package Deal */}
            <PackageCard>
              <CategoryTag style={{ background: theme.colors.accent, color: theme.colors.text }}>超值套餐</CategoryTag>
              <PriceTitle>團體 + 個人雙修</PriceTitle>
              <PriceList>
                <PriceItem><span>10 堂團體 + 10 堂個人</span></PriceItem>
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <span style={{ textDecoration: 'line-through', color: '#999' }}>NT$ 15,000</span>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: theme.colors.primary }}>NT$ 13,000</div>
                  <div style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>現省 NT$ 2,000 !</div>
                </div>
              </PriceList>
              <Note>※ 適合想快速提升球技並維持練習量的學員。</Note>
            </PackageCard>

            {/* Individual Classes */}
            <PriceCard>
              <CategoryTag>個人班 (1hr)</CategoryTag>
              <PriceTitle>一對一專屬教學</PriceTitle>
              <PriceList>
                <PriceItem><span>一般教練</span> <BoldText>NT$ 1,100 / 堂</BoldText></PriceItem>
                <PriceItem><span>指定教練</span> <BoldText>NT$ 1,300 / 堂</BoldText></PriceItem>
                <PriceItem><span>甲級教練</span> <BoldText>NT$ 1,600 / 堂</BoldText></PriceItem>
              </PriceList>
              <Note>※ 購買 10 堂或 20 堂（送1堂）享有更多優惠。多人合上(至多1對3)另有加成。</Note>
            </PriceCard>
          </PriceGrid>

          <PriceGrid style={{ marginTop: '40px' }}>
            {/* Elite / Training */}
            <PriceCard>
              <CategoryTag>精英培訓 (3hr)</CategoryTag>
              <PriceTitle>菁英班 / 選手班</PriceTitle>
              <PriceList>
                <PriceItem><span>單堂</span> <BoldText>NT$ 1,200</BoldText></PriceItem>
                <PriceItem><span>20 堂套票</span> <BoldText>NT$ 22,000</BoldText></PriceItem>
              </PriceList>
              <Note>※ 高強度訓練，包含個人課與菁英課搭配贈送。</Note>
            </PriceCard>

            {/* Table Rental */}
            <PriceCard>
              <CategoryTag>場地使用</CategoryTag>
              <PriceTitle>租桌報價</PriceTitle>
              <PriceList>
                <PriceItem><span>Plan A (純租桌)</span> <BoldText>NT$ 200 / hr</BoldText></PriceItem>
                <PriceItem><span>Plan B (含球具)</span> <BoldText>NT$ 250 / hr</BoldText></PriceItem>
                <PriceItem><span>自動發球機</span> <BoldText>+ NT$ 100 / hr</BoldText></PriceItem>
              </PriceList>
              <Note>※ 每桌建議 2-4 人使用。</Note>
            </PriceCard>
          </PriceGrid>

          <PromoBanner>
            <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>❄️ 2026 桌球冬令營 熱烈招募中！</h2>
            <p style={{ fontSize: '18px', opacity: 0.9, lineHeight: 1.6 }}>
              專業球技教學 × 趣味遊戲 × 體適能開發<br />
              讓孩子在寒假愛上運動，培養專注力與協調性！
            </p>
            <div style={{ marginTop: '24px', fontWeight: 'bold' }}>
              早鳥優惠：三人同行享 9 折，新生贈送專屬球拍！
            </div>
          </PromoBanner>

        </ContentWrapper>
      </Container>

      <RegisterSection>
        <ContentWrapper>
          <SectionTitle>🏓 現在預約｜免費試上一堂課！</SectionTitle>
          <BodyText style={{ marginTop: '20px', maxWidth: '800px', margin: '20px auto' }}>
            先體驗、再決定，零壓力 🙌<br />
            名額有限，趕快預約免費試上，讓孩子先來玩、先愛上桌球！
          </BodyText>

          <PrimaryButton
            style={{ marginTop: '40px', margin: '40px auto 0' }}
            onClick={() => window.open("https://line.me/R/ti/p/@869usyqy", "_blank")}
          >
            <ButtonText>馬上預約免費試上</ButtonText>
          </PrimaryButton>
        </ContentWrapper>
      </RegisterSection>
    </PageContainer>
  );
};

export default ClassPage;
