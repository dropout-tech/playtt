import React from "react";
import styled from "styled-components";
import banner from "../assets/homepage/banner.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const BannerImg = styled.img`
  width:100% ;
  height:100% ;

`;

const EmptyContainer = styled.div`

`;


/* desktop thw newest info style end */
const homepage = () => {
  return <PageContainer>
    <EmptyContainer>
      <BannerImg src={banner} alt="" />
    </EmptyContainer>
  </PageContainer>;
};

export default homepage;
