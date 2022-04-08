import React from "react";
import styled from "styled-components";
import cho from "../assets/alliancePlan/cho.png";
import hha from "../assets/alliancePlan/hha.png";
import ho from "../assets/alliancePlan/ho.png";



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
  display:flex;

`;

const Span = styled.span`

`;


const Circle1 = styled.div`
  z-index:1;

  width: 588px;
  height: 588px;
  left: -20px;
  top: 696px;
  background: #FFFFFF;
  transform: matrix(0, -1, 1, 0, 0, 0);
  border-radius:294px;
  margin-right:-50px;
  margin-top:30px;
  `;

const Circle2 = styled.div`
  z-index:1;
  
width: 660px;
height: 660px;
left: 390px;
top: 732px;

/* white */

background: #FFFFFF;
transform: matrix(0, -1, 1, 0, 0, 0);
 border-radius:330px;
 margin-right:-50px;
`;

const Circle3 = styled.div`
  z-index:1;

width: 588px;
height: 588px;
left: 872px;
top: 696px;

/* white */

background: #FFFFFF;
transform: matrix(0, -1, 1, 0, 0, 0);
border-radius:294px;
margin-top:30px;
`;


const Text = styled.p`
 


`;

const Circle = styled.div`
 display:flex;
 align-items: center;
 margin-left:200px;


`;















/* desktop thw newest info style end */
const alliancePlan = () => {
  return <PageContainer>
    <Container>
      <Title>聯盟計畫</Title>
      <TitleWord>Alliance</TitleWord>
      <Background>
        <Circle>
          <Circle1>
            <Text>
              <img src="" alt="" />
              <p></p>
              <p></p>
            </Text>
          </Circle1>

          <Circle2>
            <Text>
              <img src="" alt="" />
              <p></p>
              <p></p>
            </Text>
          </Circle2>

          <Circle3>
            <Text>
              <img src="" alt="" />
              <p></p>
              <p><Span></Span></p>
            </Text>
          </Circle3>
        </Circle>

      </Background>
    </Container>

  </PageContainer>;
};

export default alliancePlan;
