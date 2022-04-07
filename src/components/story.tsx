import React from "react";
import styled from "styled-components";
import banner from "../assets/homepage/banner.png";



// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const BannerImg = styled.img`
  width:100% ;
  height:1100px ;

`;



/* desktop thw newest info style end */
const Story = () => {
  return <PageContainer>

    <div>
      <BannerImg src={banner} alt="" />
    </div>


  </PageContainer>;
};

export default Story;
