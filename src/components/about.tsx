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

`;


const TopRightItems = styled.div`
 display:flex;
 width:50%;
 

`;

const LeftItems = styled.div`
 display:flex;
 width:50%;


`;

const RightItems = styled.div`
 display:flex;
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

const TopAreaItems = styled.div`
  width:100%;
  display: flex;
  justify-content:space-between;
  
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








/* desktop thw newest info style end */
const About = () => {
  return <PageContainer>
    <Container>
      <AboutItems>
        <AboutText>關於我們</AboutText>
        <AboutUs>About Us</AboutUs>
      </AboutItems>
      <TopArea>
        <TopAreaItems>
          <LeftItems>
            <StartImg src={start} alt="" />
            <div>
              <Hope>願景</Hope>
              <Slogan>Let's Play <Span>Dream</Span></Slogan>
              <Contants>我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 Let's Play！</Contants>
            </div>
          </LeftItems>

          <TopRightItems>
            <StartImg src={start} alt="" />
            <div>
              <Hope>使命</Hope>
              <Slogan>Let's Play <Span>Goal</Span></Slogan>
              <Contants>我們的使命就是讓你來玩的每一分鐘，都感受到放鬆與樂趣！來到這裡你可以輕鬆的玩、簡單的玩、隨心的玩，享受純粹的快樂！我們也致力於和不同產業領域聯盟合作，碰撞出創意無限的火花，提升整個桌球教學生態體系、創造新的無限可能。</Contants>
            </div>
          </TopRightItems>
        </TopAreaItems>

        <BelowAreaItems>
          <LeftItems>
            <StartImg src={start} alt="" />
            <div>
              <Hope>品牌理念</Hope>
              <Slogan>Let's Play <Span>Thinking</Span></Slogan>
              <Contants>感受發自內心的快樂，一起來玩吧！
                品牌的核心價值在於「讓來到 Let's Play 的人能發自內心的感受純粹的快樂」，孩子從中獲得專注力與成就感、上班族重新找回喜愛一件事物的單純與雀躍感、長者獲得豐富退休生活的歸屬感。</Contants>
            </div>
          </LeftItems>

          <RightItems>
            <StartImg src={start} alt="" />
            <div>
              <Hope>教學理念</Hope>
              <Slogan>Let's Play <Span>Teach</Span></Slogan>
              <Contants>學習桌球這件事情除了提升球技，我們更享受一起參與課程和遊戲的你們，獲得更多生命中的禮物，像是運動家精神、人生體悟、培養品性和歡笑與汗水。一起養成良好的運動習慣，多一種社交的方式，Let's Play 希望打破大家對桌球的認知，原來桌球可以在玩樂中學習成長！。</Contants>
            </div>
          </RightItems>
        </BelowAreaItems>
      </TopArea>
    </Container>




  </PageContainer>;
};

export default About;
