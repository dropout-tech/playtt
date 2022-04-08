import React from "react";
import styled from "styled-components";
import colorLine from "../assets/partnershipAndRecruit/colorLine.png";



// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Title1 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 36px;
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;

const Title2 = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
`;

const Container = styled.div`
  width: 100%;
  height:100%;


`;

const TitleContainer = styled.div`
  margin-top:500px;

`;

const BlueArea = styled.div`
  width: 100%;
  height:80%;
  background: #005CB9;  
`;





/* desktop thw newest info style end */
const PartnershipAndRecruit = () => {
  return <PageContainer>
    <Container>
      <TitleContainer>
        <Title1>合作與招募</Title1>
        <Title2>Partnership & Recruit</Title2>
      </TitleContainer>

      <BlueArea>

      </BlueArea>
    </Container>

  </PageContainer>;
};

export default PartnershipAndRecruit;
