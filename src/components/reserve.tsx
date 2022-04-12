import React from "react";
import styled from "styled-components";
import bg from "../assets/reserve/bg.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top:30px;
  padding-bottom:30px;
`;

const Container = styled.div`
  margin-top:30px;
  padding-top:60px;
  padding-bottom:40px;
`;

const BgImg = styled.img`
  width: 100%;
  height: 100%;
`;

const GreenButton = styled.button`
  background: #38D430;
  box-shadow: 0px 4px 20px rgba(26, 26, 26, 0.07);
  border:none;

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
  color: #FFFFFF;
`;

const BelowText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #3C3D3D;
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
`;

const AlignText = styled.div`
 margin-top:-130px;
 display: flex; 
 align-items: center;
 justify-content:center;
 flex-direction: column;

`;

/* desktop thw newest info style end */
const Reserve = () => {
  return <PageContainer>
    <Container>

      <TextArea>
         <AlignText>
          <GreenButton>
            <ButtonText>立即預約體驗</ButtonText>
          </GreenButton>
          <BelowText>統一由臉書私訊洽詢想預約試上的分店 Line</BelowText>
        </AlignText>
      </TextArea>


    </Container>
  </PageContainer>;
};

export default Reserve;
