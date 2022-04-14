import React from "react";
import styled from "styled-components";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   @media screen and (min-width: 768px) {
    
  }
`;

const Container = styled.div`
 height:324px;
  @media screen and (min-width: 768px) {
    
  }
`;

const Title1 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 36px;
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #FFFFFF;
   @media screen and (min-width: 768px) {
    
  }
  
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
  line-Height:52px;
   @media screen and (min-width: 768px) {
    
  }
`;

const BlueArea = styled.div`
  background: #005CB9;
  padding-top:30px;
  padding-bottom:80px;
   @media screen and (min-width: 768px) {
    
  }
`;

const Button = styled.button`
  border:none;
  width:374px;
  height:72px;
  background: #FFD900;
  box-shadow: 0px 4px 20px rgba(26, 26, 26, 0.07);
   @media screen and (min-width: 768px) {
    
  }
`;

const ButtonText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin-left:100px;
  margin-top:13px;
  @media screen and (min-width: 768px) {
    
  }
`;

const TopText = styled.div`
 @media screen and (min-width: 768px) {
    
  }
`;

const ButtonArea = styled.div`
 display: flex ;
 justify-content:center;
  @media screen and (min-width: 768px) {
    
  }

`;

const Text2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  letter-spacing: 0.04em;
  color: #FFFFFF;
  display:flex;
  justify-content: center;
   @media screen and (min-width: 768px) {
    
  }
`;

const UnderText = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.08em;
  color: #3C3D3D;
   @media screen and (min-width: 768px) {
    
  }
`;

const UnderContainer = styled.div`
  display:flex;
  justify-content: center;
   @media screen and (min-width: 768px) {
    
  }
`;

const ButtonAreas = styled.div`
  display: flex;
  justify-content: center;
   @media screen and (min-width: 768px) {
    
  }
`;

/* desktop thw newest info style end */
const HaveATry = () => {
  return <PageContainer>
    <Container>
      <BlueArea>
        <TopText>
          <Title1>預約體驗</Title1>
          <Title2>Have a Try</Title2>
        </TopText>


        <ButtonAreas>
          <Button>
            <ButtonText>立即預約體驗</ButtonText>
          </Button>
        </ButtonAreas>
       
        <Text2>統一由臉書私訊洽詢想預約試上的分店 Line</Text2>

      </BlueArea>
      
      <UnderContainer>
      <UnderText>Copyright © 2022 Let's Play</UnderText>
      </UnderContainer>
    </Container>
  </PageContainer>;
};

export default HaveATry;
