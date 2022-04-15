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
  width:1440px ;
  height:804px ;
  background-image: url('${banner}');
  background-size: contain;
  background-repeat: no-repeat;
   @media screen and (max-width: 768px) {
    background-image: url('${banner2}');
    width:375px;
    height:671px ;
  }

`;

const EmptyContainer = styled.div`

`;


/* desktop thw newest info style end */
const homepage = () => {
  return <PageContainer>
    <EmptyContainer>
      <BannerImg></BannerImg>
    </EmptyContainer>
  </PageContainer>;
};

export default homepage;
