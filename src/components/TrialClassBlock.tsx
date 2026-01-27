import React from 'react';
import styled from 'styled-components';
import { theme, media } from '../styles/theme';
import { Container, ContentWrapper, SectionTitle, BodyText, BoldText, PrimaryButton, ButtonText } from '../styles/components';

const SectionBg = styled.div`
  width: 100%;
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%);
  padding: ${theme.spacing.xxl} 0;
  border-top: 1px solid rgba(0,0,0,0.03);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 60px;
  align-items: start;

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HighlightBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(56, 212, 48, 0.1);
  color: ${theme.colors.accent};
  font-weight: bold;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;
  width: fit-content;
`;

const HighlightBox = styled.div`
  background: white;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.04);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
`;

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="10" cy="10" r="10" fill="#38D430" fillOpacity="0.2" />
    <path d="M6 10L9 13L14 7" stroke="#005CB9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 16px;
  line-height: 1.6;
  color: ${theme.colors.text};
  font-weight: 500;
`;

const TagContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const HashTag = styled.span`
  color: ${theme.colors.textMuted};
  font-size: 14px;
  border: 1px solid #E0E0E0;
  padding: 4px 10px;
  border-radius: 99px;
`;

const TrialClassBlock = () => {
  return (
    <SectionBg id="trial-class">
      <Container>
        <ContentWrapper>
          <ContentGrid>
            <InfoBox>
              <div>
                <HighlightBadge>限額體驗</HighlightBadge>
                <SectionTitle style={{ textAlign: 'left', marginBottom: '16px' }}>團體班 (小班制)</SectionTitle>
                <BodyText style={{ fontSize: '18px', color: theme.colors.textLight }}>
                  3–6 人精緻小班教學，每堂 1.5 小時。<br />
                  確保每位學員都能獲得教練的完整指導與關注。
                </BodyText>
              </div>

              <HighlightBox>
                <h3 style={{ fontSize: '22px', fontWeight: '900', color: theme.colors.primary, margin: '0 0 12px 0' }}>
                  現在預約，免費試上一堂課
                </h3>
                <BodyText style={{ color: theme.colors.textLight }}>
                  我們相信親身體驗是最好的了解方式。先體驗、再決定，完全零壓力。
                </BodyText>

                <PrimaryButton
                  style={{ width: '100%', marginTop: '24px' }}
                  onClick={() => window.open("https://line.me/R/ti/p/@869usyqy", "_blank")}
                >
                  <ButtonText>立即預約體驗</ButtonText>
                </PrimaryButton>
              </HighlightBox>

              <TagContainer>
                <HashTag>#獎勵機制</HashTag>
                <HashTag>#桌球測驗</HashTag>
                <HashTag>#趣味比賽</HashTag>
              </TagContainer>
            </InfoBox>

            <InfoBox style={{ justifyContent: 'center' }}>
              <div style={{ paddingLeft: '20px' }}>
                <BoldText style={{ fontSize: '20px', marginBottom: '24px', display: 'block' }}>完善的課程規劃</BoldText>
                <FeatureList>
                  <FeatureItem><CheckIcon /> 下肢暖身與基本操</FeatureItem>
                  <FeatureItem><CheckIcon /> 互動遊戲式球感訓練</FeatureItem>
                  <FeatureItem><CheckIcon /> 正反手對打練習</FeatureItem>
                  <FeatureItem><CheckIcon /> 單球調整與揮拍動作指導</FeatureItem>
                  <FeatureItem><CheckIcon /> 趣味體適能桌球</FeatureItem>
                  <FeatureItem><CheckIcon /> 遊戲競賽，提升學習動機</FeatureItem>
                </FeatureList>

                <Note style={{ marginTop: '32px', paddingLeft: '32px', borderLeft: '3px solid #E0E0E0' }}>
                  課程內容將依據班級進度與學員程度進行彈性調整，讓孩子先覺得好玩，進而愛上桌球運動。
                </Note>
              </div>
            </InfoBox>
          </ContentGrid>
        </ContentWrapper>
      </Container>
    </SectionBg>
  );
};

const Note = styled.p`
  font-size: 14px;
  color: ${theme.colors.textMuted};
  line-height: 1.6;
`;

export default TrialClassBlock;
