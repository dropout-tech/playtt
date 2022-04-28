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

 padding-bottom: 80px;
 @media screen and (max-width: 768px) {
    margin-top:-30px;
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
  background: #F5F6F6;
  width:100%;
  height:804px;
  @media screen and (max-width: 768px) {

  }
`;


const Circle1 = styled.div`
  display:flex;
  justify-content:center;
  width: 588px;
  height: 588px;
  background: #FFFFFF;
  border-radius:294px;
  margin-top:30px;
  margin-right:-50px;
  z-index: 1;
  position: absolute;
  left: 20px;
  

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
  width: 660px;
  height: 660px;
  background: #FFFFFF;
  border-radius:330px;
  margin-right:-50px;
  z-index: 1;
  @media screen and (max-width: 768px) {
    width: 400px;
    height:400px;
    display:flex;
    justify-content:center;
    align-items:center;
    margin-right:0px;
    margin-top:-40px;
  }
`;

const Circle3 = styled.div`
  display:flex;
  justify-content:center;
  width: 588px;
  height: 588px;
  background: #FFFFFF;
  border-radius:294px;
  margin-top:20px;
  z-index: 1;
  position: absolute;
  right: 20px;
  @media screen and (max-width: 768px) {
    width: 400px;
    height:400px;
    display:flex;
    justify-content:center;
    align-items:center;
    margin-right:0px;
    margin-top:-40px;
  }
`;

const Text2 = styled.div`
 margin-top:140px;
 z-index:10;
 position: absolute;
 left: 590px;
 
 
 

 
 @media screen and (max-width: 768px) {
    margin-top:-30px
  }
`;

const Text1 = styled.div`
 margin-top:100px;
 position: absolute;
 z-index: 10;
 left:150px;
 @media screen and (max-width: 768px) {
   margin-top:-30px
  }
`;

const Text3 = styled.div`
 margin-top:100px;
 position: absolute;
 left: 1030px;
 z-index: 10;

 @media screen and (max-width: 768px) {
   margin-top:-30px
  }
`;

const Circle = styled.div`
 display:flex;
 align-items: center;
 justify-content:center;
 padding:10px;
 padding-top:70px;

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
    margin-top:5px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    text-align: justify;
    letter-spacing: 0.02em;
    color: #1A1A1A;
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
    margin-top:10px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 0.03em;
    color: #005CB9;
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
  margin-left:-15px;
  @media screen and (max-width: 768px) {
    width:88px;
    height:40px;
    margin-top:40px;
    margin-left:-5px;
   
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

          <Text1>
            <Img src={cho} alt="" />
            <Title2>創立初衷</Title2>
            <TextForm>將既有的桌球經營 Know How 傳承與系統規劃，改善桌球產業發展，希望透過每位老闆力量，共同團結讓台灣桌球被更多人看見！</TextForm>
          </Text1>

          <Circle1>
          </Circle1>

          <Text2>
            <Img src={hha} alt="" />
            <Title2>計畫簡介</Title2>
            <TextForm>Let's Play 立志打造跨界聯盟的創新桌球團隊，主軸為三大方向：跨產業合作 X 全齡複合空間 X 運動設計美學。希望共享資源讓台灣桌球產業互利合作，推廣讓全年齡的朋友們愛上桌球，一起體驗桌球的好處和快樂！</TextForm>
          </Text2>
          <Circle2>
          </Circle2>


          <Text3>
            <Img src={ho} alt="" />
            <Title2>聯盟分佈</Title2>
            <TextForm>全台目前分店為 4 家，合作聯盟據點 10 個以上，聯盟球館</TextForm>
            <TextForm2>陸續招募中！</TextForm2>
          </Text3>
          <Circle3>
          </Circle3>
        </Circle>

      </Background>



    </Container>

  </PageContainer>;
};

export default alliancePlan;
