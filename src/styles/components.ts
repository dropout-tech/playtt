import styled, { keyframes } from 'styled-components';
import { theme, media } from './theme';

const floatY = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const shine = keyframes`
  0% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
  20% { opacity: 0.35; }
  60% { opacity: 0.2; }
  100% { transform: translateX(220%) skewX(-12deg); opacity: 0; }
`;

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
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;

  &::after {
    content: "";
    position: absolute;
    inset: -40%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.35) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: ${shine} 2.4s ease-in-out infinite;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 6px 24px rgba(26, 26, 26, 0.12);
    filter: saturate(1.03);
  }

  &:active {
    transform: translateY(0);
    filter: saturate(1);
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
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
  animation: ${floatY} 6s ease-in-out infinite;

  ${media.tablet} {
    width: 251px;
    height: 251px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
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
  animation: ${floatY} 7s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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

// ============================================
// 版面骨架（統一寬度/留白）
// ============================================

export const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: ${theme.spacing.md};
  padding-right: ${theme.spacing.md};

  ${media.tablet} {
    padding-left: ${theme.spacing.sm};
    padding-right: ${theme.spacing.sm};
  }
`;

// ============================================
// 通用卡片（沿用既有陰影/圓角語言）
// ============================================

export const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(26, 26, 26, 0.12);
  overflow: hidden;
  min-width: 0;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(26, 26, 26, 0.16);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

