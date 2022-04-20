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
  margin-left:30px;
  @media screen and (max-width: 768px) {
    
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
  @media screen and (max-width: 768px) {
    
  }
`;

const Container = styled.div`
  width: 100%;
  height:100%;
  padding-top:80px;
  padding-bottom: 80px;
  @media screen and (max-width: 768px) {
    
  }
`;

const TitleContainer = styled.div`
  margin-top:80px;
  @media screen and (min-width: 768px) {
    
  }
`;

const BlueArea = styled.div`
  width: 100%;
  height:100%;
  background: #005CB9;  
  z-index:1;
  padding-bottom:60px;
  @media screen and (max-width: 768px) {
    flex:none;
  }
`;

const ColorLineImg = styled.img`
  width: 98px;
  height: 27px;
  margin-left:80px;
  margin-top:50px;
   @media screen and (max-width: 768px) {
    
  }
`;


const GrayArea = styled.div`
  z-index:10;
  background: rgba(207, 210, 211.1);
  width: 250px;
  height:200px;
   @media screen and (max-width: 768px) {
    
  }
`;

const TextArea = styled.div`
 display:flex;
 justify-content:center;
 margin-right:55px;
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    flex-direction: column;
  }
`;

const Text = styled.div`
  display:flex;
  margin-left:60px;
  margin-top:60px;
  flex-direction:column;
   @media screen and (max-width: 768px) {
    
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
  padding-top:60px;
   @media screen and (max-width: 768px) {
    
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
  margin-left:80px;
   @media screen and (max-width: 768px) {
    
  }
`;

const WhiteArea = styled.div`
  background: #FFFFFF;
  width: 250px;
  height: 483px;
  display: flex;
  align-items: center;
  justify-content: center;
  @media screen and (max-width: 768px) {
    
  }

`;


const TextkeyIn1 = styled.p`
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
  margin-left:70px;
  @media screen and (max-width: 768px) {
    
  }
`;

const TextkeyIn2 = styled.p`
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
  margin-left:90px;
  @media screen and (max-width: 768px) {
    
  }
`;

const TextkeyIn3 = styled.p`
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
  margin-left:70px;
  @media screen and (max-width: 768px) {
    
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
  @media screen and (min-width: 768px) {
    
  }
`;

const MobileContainer = styled.div`
  


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
              <ColorLineImg src={colorLine} alt="" />
              <TopText>運動場館</TopText>
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
              <ColorLineImg src={colorLine} alt="" />
              <TopText>學校社團</TopText>
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
              <ColorLineImg src={colorLine} alt="" />
              <TopText>教育機構</TopText>
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
              <ColorLineImg src={colorLine} alt="" />
              <TopText>桌球場館</TopText>
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

      <MobileContainer>
        <BigTitle> 目前已超過 30 個合作機構<br />
          企業機構、法人團體熱烈招募合作中！
        </BigTitle>
        <TextArea>
          <Text>
            <GrayArea>
              <ColorLineImg src={colorLine} alt="" />
              <TopText>運動場館</TopText>
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
              <ColorLineImg src={colorLine} alt="" />
              <TopText>學校社團</TopText>
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
              <ColorLineImg src={colorLine} alt="" />
              <TopText>教育機構</TopText>
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
              <ColorLineImg src={colorLine} alt="" />
              <TopText>桌球場館</TopText>
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
      </MobileContainer>
    </Container>

  </PageContainer>;
};

export default PartnershipAndRecruit;
