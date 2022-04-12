import React from "react";
import styled from "styled-components";
import group from "../assets/letsPlayStar/group.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`

`;

const Title1 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 36px;
  line-height: 52px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  display: flex;
  justify-content:center;
`;

const Title2 = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  display: flex;
  justify-content:center;
  margin-top:-30px;
`;

const GroupImg = styled.img`
  width:100%;
  height:100%;
`;



/* desktop thw newest info style end */
const LetsPlayStar = () => {
  return <PageContainer>
    <Container>
      <div>
        <Title1>藝人明星桌球隊</Title1>
        <Title2>Let's Play Star </Title2>
      </div>

      <GroupImg src={group} alt="" />

    </Container>
  </PageContainer>;
};

export default LetsPlayStar;
