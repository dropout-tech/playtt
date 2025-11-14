import styled from 'styled-components';
import { theme, media } from './theme';

// ============================================
// 基礎容器組件
// ============================================

export const PageContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  ${media.mobile} {
    margin-top: 80px;
  }
`;

// ============================================
// 響應式容器組件
// ============================================

export const Container = styled.div`
  width: 100%;
  padding-top: ${theme.spacing.xxl};
  padding-bottom: ${theme.spacing.xxl};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  ${media.tablet} {
    padding-top: ${theme.spacing.xl};
    padding-bottom: ${theme.spacing.xl};
  }
`;

// 桌面版容器（在移動端隱藏）
export const DesktopContainer = styled.div`
  ${media.tablet} {
    display: none;
  }
`;

// 移動版容器（在桌面端隱藏）
export const MobileContainer = styled.div`
  display: none;

  ${media.tablet} {
    display: flex;
    flex-direction: column;
  }
`;

// ============================================
// 標題組件
// ============================================

export const SectionTitle = styled.h2`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxxl};
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: ${theme.colors.text};
  margin: 0;

  ${media.tablet} {
    font-size: ${theme.fontSize.xxl};
    line-height: 40px;
  }
`;

export const SectionSubtitle = styled.h3`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.xxxl};
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: ${theme.colors.textMuted};
  margin-top: -30px;
  margin-bottom: 0;

  ${media.tablet} {
    font-size: ${theme.fontSize.xxl};
    line-height: 40px;
    margin-top: -26px;
  }
`;

export const ContentTitle = styled.h3`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxl};
  line-height: 40px;
  letter-spacing: 0.04em;
  color: ${theme.colors.text};
  margin: 0;

  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
    line-height: 32px;
  }
`;

export const ContentSubtitle = styled.h4`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.xxl};
  line-height: 40px;
  letter-spacing: 0.04em;
  color: ${theme.colors.text};
  margin-top: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};

  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
    line-height: 32px;
  }
`;

// ============================================
// 文字組件
// ============================================

export const BodyText = styled.p`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.xl};
  line-height: 36px;
  letter-spacing: 0.03em;
  color: ${theme.colors.text};
  margin: 0;
  text-align: justify;

  ${media.tablet} {
    font-size: ${theme.fontSize.md};
    line-height: 28px;
  }
`;

export const SmallText = styled.p`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.textLight};
  margin: 0;

  ${media.tablet} {
    font-size: ${theme.fontSize.sm};
    line-height: 28px;
  }
`;

export const BoldText = styled.p`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xl};
  line-height: 36px;
  color: ${theme.colors.text};
  margin: 0;

  ${media.tablet} {
    font-size: ${theme.fontSize.md};
    line-height: 28px;
  }
`;

// ============================================
// 按鈕組件
// ============================================

export const PrimaryButton = styled.button`
  border: none;
  width: 374px;
  height: 72px;
  background: ${theme.colors.secondary};
  box-shadow: 0px 4px 20px rgba(26, 26, 26, 0.07);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 6px 24px rgba(26, 26, 26, 0.12);
  }

  &:active {
    transform: translateY(0);
  }

  ${media.tablet} {
    width: 211px;
    height: 48px;
  }
`;

export const ButtonText = styled.span`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxl};
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: ${theme.colors.primary};
  margin: 0;

  ${media.tablet} {
    font-size: ${theme.fontSize.lg};
  }
`;

// ============================================
// 裝飾性組件（替代圖片）
// ============================================

export const DecorativeCircle = styled.div<{ size?: string }>`
  width: ${props => props.size || '580px'};
  height: ${props => props.size || '580px'};
  border-radius: ${theme.borderRadius.full};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);

  ${media.tablet} {
    width: 251px;
    height: 251px;
  }
`;

export const DecorativeLine = styled.div`
  width: 100%;
  height: 4px;
  background: linear-gradient(
    90deg,
    ${theme.colors.primary} 0%,
    ${theme.colors.secondary} 50%,
    ${theme.colors.primary} 100%
  );
`;

export const DecorativeHalfCircle = styled.div`
  width: 200px;
  height: 100px;
  border-radius: 200px 200px 0 0;
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
`;

// ============================================
// 響應式圖片組件
// ============================================

export const ResponsiveImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: cover;
`;

export const ResponsiveBanner = styled.div<{ src: string }>`
  width: 100%;
  height: 100vh;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  ${media.desktop} {
    background-image: url(${props => props.src.replace('1440', '1280')});
  }

  ${media.laptop} {
    background-image: url(${props => props.src.replace('1440', '1024')});
  }

  ${media.tablet} {
    background-image: url(${props => props.src.replace('1440', '768')});
  }

  ${media.mobile} {
    background-image: url(${props => props.src.replace('1440', '414')});
  }
`;

// ============================================
// 標題組件（用於 About 等頁面）
// ============================================

export const TitleGroup = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-bottom: ${theme.spacing.xxl};

  ${media.tablet} {
    margin-bottom: ${theme.spacing.xl};
  }
`;

