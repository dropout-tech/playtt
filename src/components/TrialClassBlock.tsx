import React from 'react';
import styled from 'styled-components';
import { theme, media } from '../styles/theme';
import { Container, ContentWrapper, SectionTitle, BodyText, BoldText, PrimaryButton, ButtonText } from '../styles/components';

const SectionBg = styled.div`
  width: 100%;
  background: white;
  padding: ${theme.spacing.xxl} 0;
  border-top: 1px solid rgba(0,0,0,0.03);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};
  align-items: center;

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HighlightBox = styled.div`
  background: ${theme.colors.backgroundLight};
  padding: 24px;
  border-radius: 16px;
  border-left: 6px solid ${theme.colors.secondary};
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 16px;
  line-height: 1.6;
`;

const TrialClassBlock = () => {
    return (
        <SectionBg id="trial-class">
            <Container>
                <ContentWrapper>
                    <ContentGrid>
                        <InfoBox>
                            <SectionTitle style={{ textAlign: 'left' }}>🏓 團體班（小班制）</SectionTitle>
                            <HighlightBox>
                                <BoldText style={{ fontSize: '20px', color: theme.colors.primary }}>🎉 現在即可預約｜免費試上一堂課！</BoldText>
                                <BodyText style={{ marginTop: '8px' }}>先體驗、再決定，零壓力 🙌</BodyText>
                            </HighlightBox>

                            <BodyText>
                                團體班為 <strong>3–6 人</strong> 小班制<br />
                                上課時間 <strong>1.5 小時／堂</strong>
                            </BodyText>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>#獎勵機制</span>
                                <span style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>#桌球測驗＆趣味比賽</span>
                            </div>
                        </InfoBox>

                        <InfoBox>
                            <BoldText>課程內容包含：</BoldText>
                            <FeatureList>
                                <FeatureItem>✅ 暖身動作與基本操</FeatureItem>
                                <FeatureItem>✅ 互動遊戲式球感訓練</FeatureItem>
                                <FeatureItem>✅ 對打練習</FeatureItem>
                                <FeatureItem>✅ 單球調整與揮拍動作指導</FeatureItem>
                                <FeatureItem>✅ 趣味體適能桌球</FeatureItem>
                                <FeatureItem>✅ 遊戲競賽，提升學習動機</FeatureItem>
                            </FeatureList>

                            <Note style={{ marginTop: '10px' }}>📌 課程內容會依班級與學員程度彈性調整</Note>

                            <BodyText style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: '10px' }}>
                                👉 名額有限，趕快預約免費試上，讓孩子先來玩、先愛上桌球！
                            </BodyText>

                            <PrimaryButton
                                style={{ width: '100%', marginTop: '10px' }}
                                onClick={() => window.open("https://line.me/R/ti/p/@869usyqy", "_blank")}
                            >
                                <ButtonText>馬上報名免費試上</ButtonText>
                            </PrimaryButton>
                        </InfoBox>
                    </ContentGrid>
                </ContentWrapper>
            </Container>
        </SectionBg>
    );
};

const Note = styled.p`
  font-size: 14px;
  color: ${theme.colors.textLight};
`;

export default TrialClassBlock;
