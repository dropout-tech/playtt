import React from "react";
import styled from "styled-components";
import banner from "../assets/homepage/banner.png";
import banner2 from "../assets/homepage/banner2.png";


// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   @media screen and (max-width: 768px) {
    
  }
`;

const BannerImg = styled.img`
  width:100% ;
  height:100% ;
  background-image: url('${banner}');
   @media screen and (max-width: 768px) {
    background-image: url('${banner2}');
    width:100% ;
    height:100% ;
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
