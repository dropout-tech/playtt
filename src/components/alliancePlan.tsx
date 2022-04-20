import React from "react";
import styled from "styled-components";
import cho from "../assets/alliancePlan/cho.png";
import hha from "../assets/alliancePlan/hha.png";
import ho from "../assets/alliancePlan/ho.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  @media screen and (max-width: 768px) {
    
  }
`;

const Container = styled.div`
 width:100%;
 height:80%;
 padding-top:80px;
 padding-bottom: 80px;
 @media screen and (max-width: 768px) {
    
  }
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
  @media screen and (max-width: 768px) {
    
  }
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
  line-Height:52px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Background = styled.div`
  background: #CFD2D3;
  width:100%;
  height:100%;
  @media screen and (max-width: 768px) {

  }
`;


const Circle1 = styled.div`
  display:flex;
  justify-content:center;
  width: 450px;
  height: 450px;
  background: #FFFFFF;
  border-radius:294px;
  margin-top:30px;
  margin-right:-50px;
  @media screen and (max-width: 768px) {
   width: 400px;
   height:400px;
   display:flex;
   justify-content:center;
   align-items:center;
   margin-right:0px;
  }
`;

const Circle2 = styled.div`
  display:flex;
  justify-content:center;
  z-index:1;
  width: 600px;
  height: 600px;
  background: #FFFFFF;
  border-radius:330px;
  margin-right:-50px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Circle3 = styled.div`
  display:flex;
  justify-content:center;
  width: 450px;
  height: 450px;
  background: #FFFFFF;
  border-radius:294px;
  margin-top:20px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Text1 = styled.div`
 margin-top:140px;
 @media screen and (max-width: 768px) {
    
  }
`;

const Text2 = styled.div`
 margin-top:100px;
 @media screen and (max-width: 768px) {
  }
`;

const Circle = styled.div`
 display:flex;
 align-items: center;
 justify-content:center;
 padding:10px;
 @media screen and (max-width: 768px) {
  display:flex;
  flex-direction: column;
  }
`;

const TextForm = styled.div`
  width:310px;
  height:144px;
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  margin-top:30px;
  @media screen and (max-width: 768px) {
  }
`;

const Title2 = styled.div`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin-top:30px;
  @media screen and (max-width: 768px) {
  }
`;

const TextForm2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-top:-60px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Img = styled.img`
  width:110px;
  height:55px;
  margin-top:-30px;
  @media screen and (max-width: 768px) {
    
  }
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
            <Text2>
              <Img src={cho} alt="" />
              <Title2>創立初衷</Title2>
              <TextForm>將既有的桌球經營 Know How 傳承與系統規劃，改善桌球產業發展，希望透過每位老闆力量，共同團結讓台灣桌球被更多人看見！</TextForm>
            </Text2>
          </Circle1>

          <Circle2>
            <Text1>
              <Img src={hha} alt="" />
              <Title2>計畫簡介</Title2>
              <TextForm>Let's Play 立志打造跨界聯盟的創新桌球團隊，主軸為三大方向：跨產業合作 X 全齡複合空間 X 運動設計美學。希望共享資源讓台灣桌球產業互利合作，推廣讓全年齡的朋友們愛上桌球，一起體驗桌球的好處和快樂！</TextForm>
            </Text1>
          </Circle2>

          <Circle3>
            <Text2>
              <Img src={ho} alt="" />
              <Title2>聯盟分佈</Title2>
              <TextForm>全台目前分店為 4 家，合作聯盟據點 10 個以上，聯盟球館</TextForm>
              <TextForm2>陸續招募中！</TextForm2>
            </Text2>
          </Circle3>
        </Circle>

      </Background>

    
      
    </Container>

  </PageContainer>;
};

export default alliancePlan;
