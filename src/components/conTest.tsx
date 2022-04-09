import React from "react";
import styled from "styled-components";
import halfcircle from "../assets/conTest/halfcircle.png";




// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
  width:100%;
  height:100%;
  background: rgba(207, 210, 211,0.2);
`;

const HalfcircleImg = styled.img`
  width:25%;
  height:100%;

`;


/* desktop thw newest info style end */
const ConTest = () => {
  return <PageContainer>
    <Container>
      <HalfcircleImg src={halfcircle} alt="" />


    </Container>
  </PageContainer>;
};

export default ConTest;
