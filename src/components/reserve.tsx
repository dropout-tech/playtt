import React from "react";
import styled from "styled-components";
import bg from "../assets/reserve/bg.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
  margin-top:30px;
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
  margin-top:-250px;
  display: flex;
  justify-content: center;

`;



/* desktop thw newest info style end */
const Reserve = () => {
  return <PageContainer>
    <Container>
      <BgImg src={bg} alt="" />
    </Container>

    <TextArea>
      <GreenButton>
        <ButtonText>立即預約體驗</ButtonText>
      </GreenButton>
      <BelowText>統一由臉書私訊洽詢想預約試上的分店 Line</BelowText>
    </TextArea>
  </PageContainer>;
};

export default Reserve;
