import React from "react";
import styled from "styled-components";
import start from "../assets/about/start.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  @media screen and (max-width: 768px) {

  }
`;

const StartImg1 = styled.img`
  width: 63px;
  height:63px;
  margin-top:50px;
  margin-right:40px;
  margin-top:175px;
  @media screen and (max-width: 768px) {
    margin-left:20px;
    margin-top:140px;
    width: 38px;
    height:38px;
  }
`;

const StartImg2 = styled.img`
  width: 63px;
  height:63px;
  margin-top:40px;
  margin-right:40px;
  margin-top:175px;

  @media screen and (max-width: 768px) {
    margin-left:20px;
    width: 38px;
    height:38px;
    margin-top:180px;
  }
`;
const StartImg3 = styled.img`
  width: 63px;
  height:63px;
  margin-top:50px;
  margin-right:40px;
  margin-top:175px;
  @media screen and (max-width: 768px) {
    margin-left:40px;
    margin-top:-2px;
    width: 38px;
    height:38px;
    margin-top:30px;
  }
`;
const StartImg4 = styled.img`
  width: 63px;
  height:63px;
  margin-top:50px;
  margin-right:40px;
  margin-top:175px;
  @media screen and (max-width: 768px) {
    margin-left:20px;
    margin-top:60px;
    width: 38px;
    height:38px;
    margin-top:60px;
  }
`;

const TopArea = styled.div`
  width:100%;
  display:flex;
  margin-top:-90px;
  @media screen and (max-width: 768px) {
    width:100%;
    display:flex;
    flex-direction: column;
    margin-top:-90px;
  }
`;


const LeftItems = styled.div`
 display:flex;
 flex-direction: column;
 width:50%;
 @media screen and (max-width: 768px) {
    
  }
`;

const RightItems = styled.div`
 display:flex;
 flex-direction: column;
 width:50%;
 margin-right:60px;
 @media screen and (max-width: 768px) {
    
  }
`;

const Container = styled.div`
 width:100%;
 margin-top: -300px;
 padding-bottom: 80px;
 @media screen and (max-width: 768px) {
    display:none;
  }
 
`;

const AboutText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-Weight:900;
  font-size: 36px;
  line-height: 52px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  text-align: center;
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
  }
`;

const AboutUs = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:-35px;
  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #CFD2D3;

  }
`;

const Hope1 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  @media screen and (max-width: 768px) {
   margin-top:-10px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   letter-spacing: 0.03em;
   color: #1A1A1A;
  }
`;

const Hope2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  @media screen and (max-width: 768px) {
   margin-top:35px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   letter-spacing: 0.03em;
   color: #1A1A1A;
  }
`;

const Hope3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  @media screen and (max-width: 768px) {
   margin-top:-10px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   letter-spacing: 0.03em;
   color: #1A1A1A;
  }
`;

const Hope4 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  @media screen and (max-width: 768px) {
   margin-top:-80px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   letter-spacing: 0.03em;
   color: #1A1A1A;
  }
`;

const Slogan = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.6px;
  margin-top:-20px;
  color: #005CB9;
  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #005CB9;

  }
`;

const AboutItems = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-top:100px;
  @media screen and (max-width: 768px) {
    
  }
`;

const LeftAreaContainer = styled.div`
  width:100%;
  display: flex;
  justify-content:center;
  margin-left:60px;
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    margin-left:0px;
  }
`;

const RightAreaContainer = styled.div`
  width:50%;
  display: flex;
  justify-content:flex-start;
  margin-right:200px;
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
  }

`;



const Contants = styled.div`
  width:350px;
  height:252px;
  font-family: "Noto Sans TC";
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.6px;
  margin-top:-10px;
  @media screen and (max-width: 768px) {
     font-size: 16px;
     width:300px;
  }
`;

const Span = styled.span`
  color:#38D430;
  @media screen and (max-width: 768px) {
   font-family: 'Futura';
   font-style: normal;
   font-weight: 700;
   font-size: 18px;
   line-height: 32px; 
   letter-spacing: 0.04em;
   color:#38D430;
  }
`;

const HopeContainer = styled.div`
  display:flex;
  @media screen and (max-width: 768px) {
    margin-top:-30px;
  }
`;

const BrandContainer = styled.div`
  display:flex;
  margin-top:-30px;
  @media screen and (max-width: 768px) {
    
  }
`;

const TextArea = styled.div`
  margin-top:130px;
  @media screen and (max-width: 768px) {
   margin-left:-20px;
  }
  
`;

const TextArea2 = styled.div`
  margin-top:130px;
  @media screen and (max-width: 768px) {
   margin-left:-20px;
   margin-top:30px;
   display:flex;
  }
  
`;

const MobileContainer = styled.div`
   width:100%;
   margin-top: -190px;
   padding-bottom: 80px;
   @media screen and (min-width: 768px) {
    display:none;
  }

`;

const Hope3Container = styled.div`
 @media screen and (max-width: 768px) {
   margin-left:-20px;
  }
 
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
              <StartImg1 src={start} alt="" />
              <TextArea>
                <Hope1>願景</Hope1>
                <Slogan>Let's Play <Span>Dream</Span></Slogan>
                <Contants>我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 Let's Play！</Contants>
              </TextArea>
            </HopeContainer>
            <BrandContainer>
              <StartImg2 src={start} alt="" />
              <TextArea>
                <Hope2>品牌理念</Hope2>
                <Slogan>Let's Play <Span>Thinking</Span></Slogan>
                <Contants>感受發自內心的快樂，一起來玩吧！
                  品牌的核心價值在於「讓來到 Let's Play 的人能發自內心的感受純粹的快樂」，孩子從中獲得專注力與成就感、上班族重新找回喜愛一件事物的單純與雀躍感、長者獲得豐富退休生活的歸屬感。</Contants>
              </TextArea>
            </BrandContainer>

          </LeftItems>

        </LeftAreaContainer>


        <RightAreaContainer>
          <RightItems>
            <HopeContainer>
              <StartImg3 src={start} alt="" />
              <TextArea2>
                <Hope3>使命</Hope3>
                <Slogan>Let’s Play Goal <Span>Dream</Span></Slogan>
                <Contants>
                  我們的使命就是讓你來玩的每一分鐘，都感受到放鬆與樂趣！來到這裡你可以輕鬆的玩、簡單的玩、隨心的玩，享受純粹的快樂！我們也致力於和不同產業領域聯盟合作，碰撞出創意無限的火花，提升整個桌球教學生態體系、創造新的無限可能。
                </Contants>
              </TextArea2>
            </HopeContainer>
            <BrandContainer>
              <StartImg4 src={start} alt="" />
              <TextArea>
                <Hope4>教學理念</Hope4>
                <Slogan>Let’s Play Teach <Span>Thinking</Span></Slogan>
                <Contants>
                  學習桌球這件事情除了提升球技，我們更享受一起參與課程和遊戲的你們，獲得更多生命中的禮物，像是運動家精神、人生體悟、培養品性和歡笑與汗水。一起養成良好的運動習慣，多一種社交的方式，Let's Play 希望打破大家對桌球的認知，原來桌球可以在玩樂中學習成長！
                </Contants>
              </TextArea>
            </BrandContainer>

          </RightItems>

        </RightAreaContainer>

      </TopArea>
    </Container>

    <MobileContainer>
      <AboutItems>
        <AboutText>關於我們</AboutText>
        <AboutUs>About Us</AboutUs>
      </AboutItems>
      <TopArea>


        <HopeContainer>
          <StartImg1 src={start} alt="" />
          <TextArea>
            <Hope1>願景</Hope1>
            <Slogan>Let's Play <Span>Dream</Span></Slogan>
            <Contants>我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 Let's Play！</Contants>
          </TextArea>
        </HopeContainer>

        <BrandContainer>
          <StartImg2 src={start} alt="" />
          <TextArea>
            <Hope2>品牌理念</Hope2>
            <Slogan>Let's Play <Span>Thinking</Span></Slogan>
            <Contants>感受發自內心的快樂，一起來玩吧！
              品牌的核心價值在於「讓來到 Let's Play 的人能發自內心的感受純粹的快樂」，孩子從中獲得專注力與成就感、上班族重新找回喜愛一件事物的單純與雀躍感、長者獲得豐富退休生活的歸屬感。</Contants>
          </TextArea>
        </BrandContainer>

        <TextArea2>
          <HopeContainer>
            <StartImg3 src={start} alt="" />
          </HopeContainer>
          <Hope3Container>
            <Hope3>使命</Hope3>
            <Slogan>Let’s Play Goal <Span>Dream</Span></Slogan>
            <Contants>
              我們的使命就是讓你來玩的每一分鐘，都感受到放鬆與樂趣！來到這裡你可以輕鬆的玩、簡單的玩、隨心的玩，享受純粹的快樂！我們也致力於和不同產業領域聯盟合作，碰撞出創意無限的火花，提升整個桌球教學生態體系、創造新的無限可能。
            </Contants>
          </Hope3Container>
        </TextArea2>

        <RightItems>

          <BrandContainer>
            <StartImg4 src={start} alt="" />
            <TextArea>
              <Hope4>教學理念</Hope4>
              <Slogan>Let’s Play Teach <Span>Thinking</Span></Slogan>
              <Contants>
                學習桌球這件事情除了提升球技，我們更享受一起參與課程和遊戲的你們，獲得更多生命中的禮物，像是運動家精神、人生體悟、培養品性和歡笑與汗水。一起養成良好的運動習慣，多一種社交的方式，Let's Play 希望打破大家對桌球的認知，原來桌球可以在玩樂中學習成長！
              </Contants>
            </TextArea>
          </BrandContainer>

        </RightItems>



      </TopArea>
    </MobileContainer>



  </PageContainer>;
};

export default About;
