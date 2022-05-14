import React from "react";
import styled from "styled-components";
import colorLine from "../assets/partnershipAndRecruit/colorLine.png";



// styled components start 

const PageContainer = styled.div`
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
  margin:0px;
  @media screen and (max-width: 768px) {
    margin-left:0px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #1A1A1A;

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
  margin-left:30px;
  line-Height:52px;
  margin-top:8px;
  @media screen and (max-width: 768px) {
    margin-left:0px;
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #CFD2D3;

  }
`;

const Container = styled.div`
  width: 100%;
  height:100%;
  padding-bottom: 80px;
  @media screen and (max-width: 768px) {
    margin-top:-120px;
  }
`;

const TitleContainer = styled.div`
  margin-top:80px;
  @media screen and (min-width: 768px) {
    
  }
`;

const BlueArea = styled.div`
  width: 100%;
  height:804px;
  background: #005CB9;  
  z-index:1;
  padding-bottom:60px;
  margin-top:60px;
  @media screen and (max-width: 768px) {
    width:100%;
    height:100%;
  }
`;

const ColorLineImg = styled.img`
  width: 98px;
  height: 27px;

  margin-top:50px;
   @media screen and (max-width: 768px) {
     margin-left:10px;
     margin-top:10px;
  }
`;


const GrayArea = styled.div`
  z-index:10;
  background: #F5F6F6;
  width: 270px;
  height:150px;
  display:flex;
  justify-content:center;
  align-items: center;
  

   @media screen and (max-width: 768px) {
    width: 116px;
    height:256px;
    display:flex;
    justify-content:center;
    flex-direction: column;
  
  }
`;

const TextArea = styled.div`
 display:flex;
 justify-content:center;
 align-items: center;
 margin-right:40px;
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    align-items: center;
    flex-direction: column;
    margin-left:12px;
  
    
  }
`;

const Text = styled.div`
  display:flex;
  margin-left:40px;
  margin-top:60px;
  flex-direction:column;
   @media screen and (max-width: 768px) {
    display:flex;
    flex-direction:row;
    margin-top:20px;
  
  }

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
  padding-top:80px;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.03em;
    color: #FFFFFF;
    transform: matrix(1, 0, 0, 1, 0, 0);
    margin-left:30px;
  }
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
  margin-top:12px;
   @media screen and (max-width: 768px) {
    width:110px;
    display: flex;
    align-items: center;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-left:20px;
  }
`;

const WhiteArea = styled.div`
  background: #FFFFFF;
  width: 270px;
  height: 333px;
  display: flex;
  align-items: center;
  justify-content: center;
  @media screen and (max-width: 768px) {
    width: 211px;
    height: 256px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

`;


const TextkeyIn1 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #1A1A1A;

  @media screen and (max-width: 768px) {
    margin-left:50px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;


  }
`;

const TextkeyIn2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  @media screen and (max-width: 768px) {
    margin-left:70px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
  }
`;

const TextkeyIn3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  display: flex;
  align-items: center;
  text-align: center;

  @media screen and (max-width: 768px) {
    margin-left:50px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
  }
`;

const TextkeyIn4 = styled.p`
  width: 210px;
  height:224px;
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
  }
`;

const Textcontainer = styled.div`
  margin-top:-20px;
  display: flex;
  justify-content:center;
  align-items: center;
  flex-direction: column;
 

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
        <BigTitle> 目前已超過 30 個合作機構<br />
          企業機構、法人團體熱烈招募合作中！
        </BigTitle>
        <TextArea>
          <Text>
            <GrayArea>
              <Textcontainer>
                <ColorLineImg src={colorLine} alt="" />
                <TopText>運動場館</TopText>
              </Textcontainer>
            </GrayArea>
            <WhiteArea>
              <TextkeyIn1>
                舞動陽光<br />
                華江俱樂部<br />
                三峽運動中心<br />
                中正運動中心<br />
                等<br />
                ⋯⋯</TextkeyIn1>
            </WhiteArea>

          </Text>

          <Text>
            <GrayArea>
              <Textcontainer>
                <ColorLineImg src={colorLine} alt="" />
                <TopText>學校社團</TopText>
              </Textcontainer>
            </GrayArea>
            <WhiteArea>
              <TextkeyIn2>
                大龍國小<br />
                懷生國小<br />
                等<br />
                ⋯⋯</TextkeyIn2>
            </WhiteArea>
          </Text>

          <Text>
            <GrayArea>
              <Textcontainer>
                <ColorLineImg src={colorLine} alt="" />
                <TopText>教育機構</TopText>
              </Textcontainer>
            </GrayArea>
            <WhiteArea>
              <TextkeyIn3>
                何嘉仁幼兒園<br />
                維多利亞<br />
                喬鈴補習班<br />
                等<br />
                ⋯⋯</TextkeyIn3>
            </WhiteArea>
          </Text>

          <Text>
            <GrayArea>
              <Textcontainer>
                <ColorLineImg src={colorLine} alt="" />
                <TopText>桌球場館</TopText>
              </Textcontainer>
            </GrayArea>
            <WhiteArea>
              <TextkeyIn4>
                Let's Play 蘆洲店<br />
                Let's Play 東門店<br />
                Let's Play 善導寺店<br />
                Let's Play 新莊店<br />
                Onward TT 乒乓吧 X Let's Play<br />
                乒運動桌球館
              </TextkeyIn4>
            </WhiteArea>
          </Text>
        </TextArea>
      </BlueArea>

    </Container>

  </PageContainer>;
};

export default PartnershipAndRecruit;
