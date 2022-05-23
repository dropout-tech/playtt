import React from "react";
import styled from "styled-components";
import bg from "../assets/reserve/bg.png";
import bg2 from "../assets/reserve/bg2.png";


// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top:30px;
  padding-bottom:30px;
   @media screen and (max-width: 768px) {
    
  }
`;

const Container = styled.div`
  margin-top:-10px;
  padding-top:60px;
  padding-bottom:40px;
   @media screen and (max-width: 768px) {
    margin-top:-50px;
  }
`;



const GreenButton = styled.button`
  width:374px;
  height:72px;
  background: #38D430;
  box-shadow: 0px 4px 20px rgba(26, 26, 26, 0.07);
  border:none;
   @media screen and (max-width: 768px) {
    width:211px;
    height:48px;
    display:flex;
    justify-content:center;
    align-items: center;
    margin-top:150px;
  }

`;

const ButtonText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content:center;
  letter-spacing: 0.04em;
  color: #FFFFFF;
  
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 18px;
    line-height:48px;
    letter-spacing: 0.04em;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    text-align: center;
  }
`;

const BelowText = styled.p`
  font-family: 'Futura ';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #3C3D3D;
  margin-top:2px;
   @media screen and (max-width: 768px) {
    font-size: 14px;
    margin-top:10px;
    display: flex; 
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 28px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.06em;
    color: #3C3D3D;
    
 
  }
`;

const TextArea = styled.div`
  width:100%;
  height:610px;
  display: flex;
  align-items: center;
  justify-content:center;
  flex-direction: column;
  background-image: url('${bg}');
  background-size: contain;
  background-repeat: no-repeat;
  background-position:center;
  
   @media screen and (max-width: 768px) {
    background-image: url('${bg2}');
    background-size:contain ;
    background-repeat: no-repeat;
    background-position:center;
    width:100%;
    height:310px; 
   }
`;

const AlignText = styled.div`
 display: flex; 
 align-items: center;
 justify-content:center;
 flex-direction: column;
 margin-top:40px;
;
  @media screen and (max-width: 768px) {
   margin-top:-120px;
  }

`;

const Text = styled.div`
  height:60px;
  margin-top:-10px;
   @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    align-items: center;
    margin-top:0px;
 
  }

`;

const Span = styled.p`
  font-family:'Futura';
  font-weight:500;
  font-size:18px;
  line-height:32px;
  letter-spacing:4%;
`;

/* desktop thw newest info style end */
const Reserve = () => {
  return <PageContainer>
    <Container>

      <TextArea>
        <AlignText>
          <GreenButton>
            <Text>
              <ButtonText>立即預約體驗</ButtonText>
            </Text>
          </GreenButton>
          <BelowText>統一由臉書私訊洽詢想預約試上的分店 <Span>&ensp;Line</Span></BelowText>
        </AlignText>
      </TextArea>


    </Container>
  </PageContainer>;
};

export default Reserve;
