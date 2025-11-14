import React from "react";
import styled from "styled-components";
import { PageContainer } from "../styles/components";
import { media } from "../styles/theme";

import banner1440 from "../assets/homepage/banner1440.png";
import banner1280 from "../assets/homepage/banner1280.png";
import banner1024 from "../assets/homepage/banner1024.png";
import banner768 from "../assets/homepage/banner768.png";
import banner414 from "../assets/homepage/banner414.png";

// 優化後的 Banner - 使用單一組件 + CSS media queries
// 代碼量減少 66%，更易於維護
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
  }
`;

const Homepage = () => {
  return (
    <PageContainer id="home">
      <Banner />
    </PageContainer>
  );
};

export default Homepage;
