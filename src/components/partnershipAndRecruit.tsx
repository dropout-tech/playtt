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

const ColorLineImg = styled.img`
  width: 98px;
  height: 27px;
  margin-left:110px;
  margin-top:50px;
`;

const GrayArea = styled.div`
  background: #CFD2D3;
  width: 350px;
  height:200px;
`;

const TextArea = styled.div`
 display:flex;
 justify-content:center;
`;

const Text = styled.div`
  display:flex;
  margin-left:60px;
  margin-top:60px;
  flex-direction:column;
`;

const BigTitle = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #FFFFFF;
`;

const TopText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-left:120px;
`;

const WhiteArea = styled.div`
  background: #FFFFFF;
  width: 350px;
  height: 483px;
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
        <BigTitle> 目前已超過 30 個合作機構
          企業機構、法人團體熱烈招募合作中！</BigTitle>
        <TextArea>
          <Text>
            <GrayArea>
              <ColorLineImg src={colorLine} alt="" />
              <TopText>運動場館</TopText>
            </GrayArea>
            <WhiteArea>
              <p></p>
            </WhiteArea>
          
          </Text>

          <Text>
            <GrayArea>
              <ColorLineImg src={colorLine} alt="" />
              <TopText>學校社團</TopText>
            </GrayArea>
            <WhiteArea>
              <p></p>
            </WhiteArea>
          </Text>

          <Text>
            <GrayArea>
              <ColorLineImg src={colorLine} alt="" />
              <TopText>教育機構</TopText>
            </GrayArea>
            <WhiteArea>
              <p></p>
            </WhiteArea>
          </Text>

          <Text>
            <GrayArea>
              <ColorLineImg src={colorLine} alt="" />
              <TopText>桌球場館</TopText>
            </GrayArea>
            <WhiteArea>
              <p></p>
            </WhiteArea>
          </Text>
        </TextArea>
      </BlueArea>
    </Container>

  </PageContainer>;
};

export default PartnershipAndRecruit;
