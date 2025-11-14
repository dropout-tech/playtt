/**
 * 改進後的 Homepage 組件
 * 
 * 改進重點：
 * 1. 使用單一組件替代 5 個不同的 styled components
 * 2. 使用 CSS background-image + media queries 處理響應式圖片
 * 3. 代碼更簡潔、易於維護
 */

import React from "react";
import styled from "styled-components";
import { PageContainer } from "../styles/components";
import { theme, media } from "../styles/theme";

// 導入圖片
import banner1440 from "../assets/homepage/banner1440.png";
import banner1280 from "../assets/homepage/banner1280.png";
import banner1024 from "../assets/homepage/banner1024.png";
import banner768 from "../assets/homepage/banner768.png";
import banner414 from "../assets/homepage/banner414.png";

// ============================================
// 改進方式一：使用 CSS background-image
// ============================================

const Banner = styled.div`
  width: 100%;
  height: 100vh;
  background-image: url(${banner1440});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  /* 響應式圖片切換 */
  ${media.desktop} {
    background-image: url(${banner1280});
  }

  ${media.laptop} {
    background-image: url(${banner1024});
  }

  ${media.tablet} {
    background-image: url(${banner768});
  }

  ${media.mobile} {
    background-image: url(${banner414});
    margin-top: 80px;
  }
`;

// ============================================
// 改進方式二：使用 <picture> 元素（更語義化）
// ============================================

const ResponsiveBannerPicture = () => (
  <picture>
    <source media="(max-width: 414px)" srcSet={banner414} />
    <source media="(max-width: 768px)" srcSet={banner768} />
    <source media="(max-width: 1024px)" srcSet={banner1024} />
    <source media="(max-width: 1280px)" srcSet={banner1280} />
    <img src={banner1440} alt="Let's Play 首頁橫幅" style={{ width: '100%', height: '100vh', objectFit: 'cover' }} />
  </picture>
);

// ============================================
// 主組件
// ============================================

const Homepage = () => {
  return (
    <PageContainer id="home">
      {/* 使用方式一：CSS background-image */}
      <Banner />

      {/* 或使用方式二：<picture> 元素 */}
      {/* <ResponsiveBannerPicture /> */}
    </PageContainer>
  );
};

export default Homepage;

/**
 * 對比：
 * 
 * 改進前：
 * - 5 個不同的 styled components (BannerImg1-5)
 * - 每個都有重複的 @media 查詢
 * - 代碼行數：~150 行
 * 
 * 改進後：
 * - 1 個 styled component
 * - 統一的 media queries
 * - 代碼行數：~50 行
 * - 減少 66% 的代碼量
 */

