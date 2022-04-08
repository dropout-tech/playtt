import React from "react";
import styled from "styled-components";
import cho from "../assets/alliancePlan/cho.png";
import hha from "../assets/alliancePlan/hha.png";
import ho from "../assets/alliancePlan/ho.png";
import circle from "../assets/alliancePlan/Circle.png";



// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
 margin-top:550px;
`;

const Title = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 34px;
  line-height: 49px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;

const TitleWord = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 34px;
  line-height: 45px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:-10px;
`;

const Background = styled.div`
  background: #CFD2D3;
  width:100%;
  height:100%;
`;

const Span = styled.span`

`;

const CircleImg = styled.img`
 width: 100%;
 height: 100%;
 margin-top:90px;
`;

/* desktop thw newest info style end */
const alliancePlan = () => {
  return <PageContainer>
    <Container>
      <Title>聯盟計畫</Title>
      <TitleWord>Alliance</TitleWord>
      <Background>
        <div>
          <CircleImg src={circle} alt="" />
        </div>
        <div>
          <div>
            <img src="" alt="" />
            <p></p>
            <p></p>
          </div>

          <div>
            <img src="" alt="" />
            <p></p>
            <p></p>
          </div>

          <div>
            <img src="" alt="" />
            <p></p>
            <p><Span></Span></p>

          </div>
        </div>

      </Background>
    </Container>

  </PageContainer>;
};

export default alliancePlan;
