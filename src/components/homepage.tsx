import React from "react";
import styled from "styled-components";
import banner from "../assets/homepage/banner.png";
import banner2 from "../assets/homepage/banner2.png";


// styled components start 

const PageContainer = styled.div`
  width:100%;
  height:100%;
  display: flex;
  flex-direction: column;

   @media screen and (max-width: 768px) {
    
  }
`;

const BannerImg = styled.img`
  width:100% ;
   @media screen and (max-width: 768px) {
   display:none;

  }

`;

const BannerImg2 = styled.img`
   display:none;
   @media screen and (max-width: 768px) {
  display: flex;
   width:100% ;
   height:804px ;

  }

`;
const EmptyContainer = styled.div`

`;


/* desktop thw newest info style end */
const homepage = () => {
  return <PageContainer>
    <EmptyContainer>
      <BannerImg src={banner} />
      <BannerImg2 src={banner2} />

    </EmptyContainer>
  </PageContainer>;
};

export default homepage;
