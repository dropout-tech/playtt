import React from "react";
import styled from "styled-components";
import start from "../assets/about/start.png";

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const StartImg = styled.img`
  width: 63px;
  height:63px;
  margin-top:50px;
  margin-right:20px;
`;

const TopArea = styled.div`
  width:100%;
  display:flex;

`;


const TopRightItems = styled.div`
 display:flex;
 width:50%;
 

`;

const LeftItems = styled.div`
 display:flex;
 flex-direction: column;
 width:50%;
 
`;

const RightItems = styled.div`
 display:flex;
 flex-direction: column;
 width:50%;
 
 
`;


const belowLeftItems = styled.div`

`;


const belowRightItems = styled.div`

`;

const Container = styled.div`
 width:100%;
`;

const AboutText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 36px;
  line-height: 52px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  text-align: center;
`;

const AboutUs = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:-10px;
`;

const Hope = styled.p`
  
font-family: 'Noto Sans TC';
font-style: normal;
font-weight: 900;
font-size: 30px;
line-height: 44px;
letter-spacing: 0.04em;
color: #1A1A1A;
`;


const Slogan = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color: #005CB9;
 
`;

const AboutItems = styled.div`

  display: flex;
  justify-content: center;
  flex-direction: column;

`;

const LeftAreaContainer = styled.div`
  width:100%;
  display: flex;
  justify-content:flex-end;
  margin-right:40px;
  
`;
const RightAreaContainer = styled.div`
  width:100%;
  display: flex;
  justify-content:flex-start;
  margin-left:40px;
  
`;

const BelowAreaItems = styled.div`
  display: flex;
  justify-content:space-between;
  

`;

const Contants = styled.p`
  width:477px;
  height:252px;
`;


const Span = styled.span`
  color:#38D430;
`;


const HopeContainer = styled.div`
  display:flex;


`;


const BrandContainer = styled.div`
  display:flex;
  margin-top:-30px;

`;










/* desktop thw newest info style end */
const About = () => {
  return <PageContainer>
    <Container>
      <AboutItems>
        <AboutText>關於我們</AboutText>
        <AboutUs>About Us</AboutUs>
      </AboutItems>
      <TopArea>
        <LeftAreaContainer>
          <LeftItems>
            <HopeContainer>
            <StartImg src={start} alt="" />
              <div>
                <Hope>願景</Hope>
                <Slogan>Let's Play <Span>Dream</Span></Slogan>
                <Contants>我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 Let's Play！</Contants>
              </div>
            </HopeContainer>
            <BrandContainer>
              <StartImg src={start} alt="" />
              <div>
                <Hope>品牌理念</Hope>
                <Slogan>Let's Play <Span>Thinking</Span></Slogan>
                <Contants>感受發自內心的快樂，一起來玩吧！
                  品牌的核心價值在於「讓來到 Let's Play 的人能發自內心的感受純粹的快樂」，孩子從中獲得專注力與成就感、上班族重新找回喜愛一件事物的單純與雀躍感、長者獲得豐富退休生活的歸屬感。</Contants>
              </div>
            </BrandContainer>

          </LeftItems>
     
        </LeftAreaContainer>


        <RightAreaContainer>
          <RightItems>
            <HopeContainer>
              <StartImg src={start} alt="" />
              <div>
                <Hope>願景</Hope>
                <Slogan>Let's Play <Span>Dream</Span></Slogan>
                <Contants>我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 Let's Play！</Contants>
              </div>
            </HopeContainer>
            <BrandContainer>
              <StartImg src={start} alt="" />
              <div>
                <Hope>品牌理念</Hope>
                <Slogan>Let's Play <Span>Thinking</Span></Slogan>
                <Contants>感受發自內心的快樂，一起來玩吧！
                  品牌的核心價值在於「讓來到 Let's Play 的人能發自內心的感受純粹的快樂」，孩子從中獲得專注力與成就感、上班族重新找回喜愛一件事物的單純與雀躍感、長者獲得豐富退休生活的歸屬感。</Contants>
              </div>
            </BrandContainer>

          </RightItems>

        </RightAreaContainer>
        
      </TopArea>
    </Container>




  </PageContainer>;
};

export default About;
