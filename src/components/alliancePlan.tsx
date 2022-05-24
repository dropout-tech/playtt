import React from "react";
import styled from "styled-components";
import cho from "../assets/alliancePlan/cho.png";
import hha from "../assets/alliancePlan/hha.png";
import ho from "../assets/alliancePlan/ho.png";
import phone1 from "../assets/alliancePlan/phone1.png";
import phone2 from "../assets/alliancePlan/phone2.png";
import phone3 from "../assets/alliancePlan/phone3.png";
import BgWeb from "../assets/alliancePlan/BgWeb.png";
import BgMobile from "../assets/alliancePlan/BgMobile.png";
// styled components start 


//computer

const PageContainer = styled.div`
  width:100%;
`;

const Container = styled.div`
 width:100%;
 height:1011px;
 @media screen and (max-width: 768px) {
display:none;
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
  margin:0px;
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
  margin-top:8px;
  line-Height:52px;
`;

const Background = styled.div`
  background: #F5F6F6;
  width:100%;
  height:80%;
  margin-top:60px;
  @media screen and (max-width: 768px) {
   margin-top:14px;
  

  }

`;

const Text1 = styled.div`
 margin-top:-100px;
 margin-right:130px;
`;

const Text2 = styled.div`
 margin-top:-100px;
`;

const Text3 = styled.div`
 margin-top:-98px;
 margin-left:130px;
`;

const Circle = styled.div`
 display:flex;
 align-items: center;
 justify-content:center;
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
  position: relative;
  z-index:10;
`;

const Title2 = styled.div`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin-top:3px;
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
`;

const Img = styled.img`
  width:130px;
  height:64px;
  margin-top:-10px;
  margin-left:-15px;
`;


// Mobile

const Container2 = styled.div`
 display: none;
@media screen and (max-width: 768px) {
 width:100%;
 display: flex;
 padding-bottom: 80px;
 padding-top:180px;
 }

`;


const MobileContainer = styled.div`
display:none;
@media screen and (max-width: 768px) {
   display:flex;
   flex-direction: column;
   width:100%;



 }
`;

const Title02 = styled.p`
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    /* identical to box height, or 154% */

    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;

    /* black */

    color: #1A1A1A;
  }

`;

const TitleWord2 = styled.p`
   @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 26px;
    line-height: 40px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #CFD2D3;
    margin-top:-35px;
 }
`;


const Text11 = styled.div`
@media screen and (max-width: 768px) {
    margin-top:30px;
    margin-left:-130px;

  }
 
`;

const Text22 = styled.div`
@media screen and (max-width: 768px) {
    margin-top:-120px;
    margin-left:-130px;

  }
 
 
`;
const Text33 = styled.div`
@media screen and (max-width: 768px) {
    margin-bottom:100px;
    margin-left:-130px;

  }


`;

const MobleCircleDiv = styled.div`
@media screen and (max-width: 768px) {
  display:flex;
  flex-direction: column;
  align-items: center;
  justify-content:space-between;
  height:965px;
  background-image: url('${BgMobile}');
  background-size:contain ;
  background-repeat: no-repeat;
  background-position:center;
 
}`;

const Img1 = styled.img`
   width:106px;
   height:42px;

`;
const Img2 = styled.img`
  @media screen and (max-width: 768px) {
   width:106px;
   height:42px;
  
}

`;

const Img3 = styled.img`
  @media screen and (max-width: 768px) {
   width:106px;
   height:42px;
  
}

`;

const TitleContainer = styled.div`
  
  @media screen and (max-width: 768px) {
  z-index:10px;
  display:flex;
  align-items: center;
  z-index: 10;
  flex-direction: column;
  margin-top:-99px;
}

`;

const Title22 = styled.p`

  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 0.03em;
    color: #005CB9;
    margin-top:1px;
   
  }
`;
const TextForm222 = styled.p`

  @media screen and (max-width: 768px) {
    width:251px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    text-align: justify;
    letter-spacing: 0.02em;
    color: #1A1A1A;
    margin-top:-8px;
    position: absolute;
    z-index: 10;
  }
`;

const TextForm2222 = styled.p`

  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 18px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-top:-8px;
  }
`;

const Span = styled.span`
  font-family: 'Futura';
  font-weight:500;
  font-size:20px;
  line-height:36px;
  letter-spacing:3%;

`;


const TextArea = styled.div`
  position:relative;
  z-index:10; 
  display:flex;
  justify-content:center; 
  align-items:center;
  height:804px;

   @media screen and (max-width: 768px) {

  }

`;


const BgWebDiv = styled.div`
 height:804px;
 background-image: url('${BgWeb}');
 background-size:contain ;
 background-repeat: no-repeat;
 background-position:center;
 

`;


/* desktop thw newest info style end */
const alliancePlan = () => {
  return <PageContainer>
    <Container>
      <Title>聯盟計畫</Title>
      <TitleWord>Alliance</TitleWord>
      <Background>
        <BgWebDiv>
          <TextArea>
            <Text1>
              <Img src={cho} alt="" />
              <Title2>創立初衷</Title2>
              <TextForm>將既有的桌球經營 <Span>Know How</Span> 傳承與系統規劃，改善桌球產業發展，希望透過每位老闆力量，共同團結讓台灣桌球被更多人看見！</TextForm>
            </Text1>
            <TextArea>
              <Text2>
                <Img src={hha} alt="" />
                <Title2>計畫簡介</Title2>
                <TextForm><Span>Let's Play</Span> 立志打造跨界聯盟的創新桌球團隊，主軸為三大方向：跨產業合作<Span> X </Span>  全齡複合空間 <Span> X </Span> 運動設計美學。希望共享資源讓台灣桌球產業互利合作，推廣讓全年齡的朋友們愛上桌球，一起體驗桌球的好處和快樂！</TextForm>
              </Text2>
            </TextArea>


            <TextArea>
              <Text3>
                <Img src={ho} alt="" />
                <Title2>聯盟分佈</Title2>
                <TextForm>全台目前分店為 <Span>4</Span> 家，合作聯盟據點  <Span>10</Span> 個以上，聯盟球館</TextForm>
                <TextForm2>陸續招募中！</TextForm2>
              </Text3>
            </TextArea>


          </TextArea>
        </BgWebDiv>
        <Circle> 

        </Circle>

      </Background>

    </Container>

    <Container2>
      <MobileContainer>
        <TitleContainer>
          <Title02>聯盟計畫</Title02>
          <TitleWord2>Alliance</TitleWord2>
        </TitleContainer>
        <Background>
          <MobleCircleDiv>
            <Text11>
              <Img1 src={phone1} alt="" />
              <Title22>創立初衷</Title22>
              <TextForm222>將既有的桌球經營 <Span>Know How </Span>傳承與系統規劃，改善桌球產業發展，希望透過每位老闆力量，共同團結讓台灣桌球被更多人看見！</TextForm222>
            </Text11>
  
            <Text22>
              <Img2 src={phone2} alt="" />
              <Title22>計畫簡介</Title22>
              <TextForm222><Span>Let's Play</Span> 立志打造跨界聯盟的創新桌球團隊，主軸為三大方向：跨產業合作 <Span>X </Span>全齡複合空間<Span>X</Span>  運動設計美學。希望共享資源讓台灣桌球產業互利合作，推廣讓全年齡的朋友們愛上桌球，一起體驗桌球的好處和快樂！</TextForm222>
            </Text22>

            <Text33>
              <Img3 src={phone3} alt="" />
              <Title22>聯盟分佈</Title22>
              <TextForm222>全台目前分店為 <Span>4</Span> 家，合作聯盟據點 <Span>10</Span> 個以上，聯盟球館</TextForm222>
              <TextForm2222>陸續招募中！</TextForm2222>
            </Text33>
          
          </MobleCircleDiv>

        </Background>


      </MobileContainer>
    </Container2>



  </PageContainer>;
};

export default alliancePlan;
