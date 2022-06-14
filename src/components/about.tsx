import React from "react";
import styled from "styled-components";
import start from "../assets/about/start.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  @media screen and (max-width: 414px) {

  }
`;

const StartImg1 = styled.img`
  width: 63px;
  height:63px;
  margin-top:40px;
  margin-right:40px;

   @media screen and (min-width: 1440px) {
   
    margin-right:30px;
    margin-top:20px;
    width: 60px;
    height:60px;
  }

    @media screen and (max-width: 1440px) {
    
      margin-right:30px;
      margin-top:45px;
      width: 60px;
      height:60px;
  }
  @media screen and (max-width: 768px) {
    margin-right:30px;
    margin-top:40px;
    width: 60px;
    height:60px;
  }
  
  @media screen and (max-width: 414px) {
    margin-left:110px;
    margin-right:30px;
    margin-top:105px;
    width: 38px;
    height:38px;
  }
`;

const TopArea = styled.div`
  width:100%;
  display:flex;
  justify-content:center;
  margin-top:-59px;
  margin-bottom:20px;

  @media screen and (max-width: 1280px) {
    width:100%;
    display:flex;
    justify-content:center;
    margin-top:-59px;
    margin-bottom:20px;

   }

   @media screen and (max-width: 768px) {
    width:100%;
    display:flex;
    justify-content:center;
    margin-top:-42px;
    margin-bottom:20px;

   }
  
  @media screen and (max-width: 414px) {
    width:100%;
    margin-left:-30px;
    flex-direction: column;
    margin-top:-90px;
    margin-bottom:0px;
    margin-left:-65px;
  }

   
`;


const LeftItems = styled.div`
 display:flex;
 flex-direction: column;
 align-items:flex-end;
 width:50%;
 margin-top:100px;

 @media screen and (max-width:414px) {
   
  }
`;

const RightItems = styled.div`
 display:flex;
 flex-direction: column;
 align-items: flex-start;
 width:50%;
 margin-left:40px;
 margin-top:101px;
 @media screen and (max-width: 414px) {
    
  }
`;

const Container = styled.div`
 @media screen and (min-width: 1440px) {
     width:100%;
     margin-top:124px;
     padding-bottom: 124px;
  }
  @media screen and (max-width: 1440px) {
     width:100%;
     margin-top:10px;
     padding-bottom: 104px;
  }

  @media screen and (max-width: 1280px) {
    display:flex;
    flex-direction: column;
  }
  
 @media screen and (max-width: 768px) {
   display:none;
  }

 @media screen and (max-width: 414px) {
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
  margin:0px;
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 30px;
    line-height: 44px;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;

    

  }
  @media screen and (max-width: 414px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    display:flex;
    justify-content:center;
    align-items: center;
    margin-top:-10px;
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
  margin-top:8px;

   @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 30px;
    line-height: 44px;
    text-align: center;
    letter-spacing: 0.04em;
  }
  @media screen and (max-width: 414px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #CFD2D3;
    margin-left:0px;
    margin-top:0px;

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
  margin:0px;
@media screen and (max-width: 1024px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #1A1A1A;

  }
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
  }
  @media screen and (max-width: 414px) {
   margin-top:-10px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   letter-spacing: 0.03em;
   color: #1A1A1A;
   margin-left:20px;

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
  margin:-1px;
  @media screen and (max-width: 1024px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #1A1A1A;

  }

  @media screen and (max-width: 414px) {
   margin-top:-10px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   letter-spacing: 0.03em;
   color: #1A1A1A;
   margin-left:0px;
  
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
  margin:0px;

  @media screen and (max-width: 1024px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #1A1A1A;

  }
  @media screen and (max-width: 414px) {
   margin-top:-80px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   letter-spacing: 0.03em;
   color: #1A1A1A;
   margin-left:-10px;
  }
`;

const Slogan = styled.div`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 36px;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin-left:1px;
  margin-top:4px;
  @media screen and (max-width:1024px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 23px;
    line-height: 36px;
    letter-spacing: 0.04em;
    color: #005CB9;
  }
 @media screen and (max-width:768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 23px;
    line-height: 36px;
    letter-spacing: 0.04em;
    color: #005CB9;
  }
  @media screen and (max-width: 414px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #005CB9;
    margin-left:20px ;
    
    
  
  }
`;

const AboutItems = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-top:80px;
  @media screen and (max-width: 414px) {
    
  }
`;


const Contants = styled.div`
  width:477px;
  height:auto;
  font-family: "Noto Sans TC";
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.6px;
  margin-top:24px;
  
 @media screen and (max-width: 1024px) {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  text-align: justify;
  letter-spacing: 0.04em;
  color: #1A1A1A;

    
  }
  @media screen and (max-width: 414px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    letter-spacing: 0.02em;
    color: #1A1A1A;
    width:100%;
    margin-left:-36px;
    margin-top:8px; 
  }

  @media screen and (max-width: 1280px) {
    width:397px;
    height:288px;
   
  }


  @media screen and (max-width: 1024px) {
    width:309px;
    height:320px;
   
  }
`;


const Span = styled.span`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color:#38D430;

  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 23px;
    line-height: 36px;
    letter-spacing: 0.04em;
    color:#38D430;
  }

  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 23px;
    line-height: 36px;
    letter-spacing: 0.04em;
    color:#38D430;
  }
  @media screen and (max-width: 414px) {
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
  justify-content:center;
  margin:0px;
  
  @media screen and (max-width: 414px) {
   margin-left:8px;
  }
`;


const BrandContainer = styled.div`
  display:flex;
  justify-content:space-between;

  @media screen and (max-width:414px) {
    display:flex;
    justify-content:flex-start;
    align-items:flex-start;
  }
`;

const TextArea = styled.div`
  margin-top:100px;
  display:flex;
  justify-content:space-between;
  @media screen and (max-width: 1440px) {
    display:flex;
    justify-content:center;
    align-items: flex-start;
    margin-top:70px;
   
    
   
  }
  @media screen and (max-width: 414px) {
    display:flex;
    justify-content:center;
    align-items: flex-start;
    flex-direction: column;
   
  }
  
`;

const TextArea22 = styled.div`

  @media screen and (max-width: 1440px) {
    display:flex;
    justify-content:center;
    align-items: flex-start;
    flex-direction: column;
    margin-top:137px;
   
  }

  @media screen and (max-width: 1024px) {
    display:flex;
    justify-content:center;
    align-items: flex-start;
    flex-direction: column;
    margin-top:66px;
   
  }
  
`;


const TextArea11 = styled.div`
   display:flex;
   justify-content:space-between;
  @media screen and (max-width: 414px) {
   display:flex;
   justify-content:space-between;
  }
  
`;


const TextArea3 = styled.div`
  display:flex;
  justify-content:space-between;
  margin-top:-2px;

   @media screen and (min-width: 1440px) {
    margin-top:173px;
  }
  
   @media screen and (max-width: 1440px) {
    margin-top:7px;
  }

   @media screen and (max-width: 1280px) {
    margin-top:0px;
  }

   @media screen and (max-width: 768px) {
    margin-top:0px;
  }
  @media screen and (max-width: 414px) {
   margin-left:-20px;
   margin-top:30px;
   display:flex;
  }
  
`;

const TextArea2 = styled.div`
  display:flex;
  justify-content:space-between;
  @media screen and (max-width: 414px) {
   margin-left:-20px;
   margin-top:30px;
   display:flex;
  }
  
`;

const MobileContainer = styled.div`
 @media screen and (min-width: 1440px) {
  
   display:none;
  }
 @media screen and (max-width: 1440px) {
  
   display:none;
  }
 @media screen and (max-width: 1280px) {
  
   display:none;
  }

   @media screen and (max-width: 1024px) {
  
   display:none;
  }
   @media screen and (max-width: 768px) {
  
   display:none;
  }
   @media screen and (max-width: 414px) {
    display:flex;
    flex-direction:column;
  }
  
  
`;

const TextContainer = styled.div`
  margin-top:2px;
  @media screen and (max-width: 1440px) {
    margin-top:30px;
    }
`;


const PicturAndText = styled.div`
 display:flex;

  @media screen and (max-width:  414px) {
  
  }

`;


const AlignText = styled.div`
 display:flex;
 flex-direction: column;
 

`;

const Span2 = styled.span`
  font-family: 'Futura';
  font-weight:500;
  font-size:20px;
  line-height:36px;
  letter-spacing:3%;

`;



const Span33 = styled.span`
  font-family: 'Futura';
  font-weight:500;
  font-size:20px;
  line-height:36px;
  letter-spacing:3%;
  margin:0px;
  @media screen and (max-width: 414px) {
    font-family: 'Futura';
    font-weight:500;
    font-size:16px;
    line-height:30px;
    letter-spacing:0.02em;
    margin:0px;


  }

`;

const TextContener1 = styled.div`
@media screen and (max-width: 768px) {
   display: flex;
   margin-top:42px;

  }
 @media screen and (max-width: 414px) {
   display: flex;
   padding-left:12px;
   padding-right:12px;

  }
`;

const TextContener = styled.div`
 @media screen and (max-width: 768px) {
   display: flex;
   flex-direction:column; 
   /* padding-left:12px;
   padding-right:12px; */
   margin-top:18px;
  }
 @media screen and (max-width: 414px) {
   display: flex;
   flex-direction:column; 
   padding-left:12px;
   padding-right:12px;
   margin-top:2px;
  }
`;

const AlignContener = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top:54px;
  @media screen and (max-width: 414px) {
  margin-left:0px;
  }
 @media screen and (max-width: 414px) {
  margin-top:68px;
  margin-left:10px;
  }
`;

const AlignContener2 = styled.div`
  @media screen and (max-width: 768px) {
   display: flex;
   flex-direction: row;
   align-items: center;
   margin-top:0px;
   margin-left:10px;
  }
 
 @media screen and (max-width: 414px) {
   display: flex;
   flex-direction: row;
   align-items: center;
   margin-top:24px;
   margin-left:10px;
  }
`;

const StartImg = styled.img`
  width: 38px;
  height: 38px ;
  margin-right: 8px;
    @media screen and (max-width: 768px) {
     margin-top:-207px;
     width: 60px;
     height: 60px ;
  }

    @media screen and (max-width: 414px) {
     margin-top:0px;
  }

`;

const Text = styled.div`
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 32px;
    text-align: justify;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-top:24px;

  }

   @media screen and (max-width: 414px) {
    margin-top:10px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    letter-spacing: 0.02em;

  }

`;

const IpadConainer = styled.div`
  @media screen and (min-width: 1440px) {
    display:none;
  }
  @media screen and (max-width: 1440px) {
    display:none;
  }

  @media screen and (max-width: 1280px) {
    display:none;
  }
  @media screen and (max-width: 768px) {
    display:flex;
    flex-direction:column;
    padding-right:60px;
    padding-left:60px;
    margin-top:-88px;
  }
  @media screen and (max-width: 414px) {
    display:none;
  }

`;

const Textcontainer2 = styled.div`
  display: flex ;
  flex-direction: column;
  @media screen and (max-width: 768px) {
    display:flex;
    flex-direction:column;
  }
`;



/* desktop thw newest info style end */
const About = () => {
  return <PageContainer id="about">
    <Container>
      <AboutItems>
        <AboutText>關於我們</AboutText>
        <AboutUs>About Us</AboutUs>
      </AboutItems>
      <TopArea>
        <LeftItems>
          <HopeContainer>
            <TextArea11>
              <PicturAndText>
                <StartImg1 src={start} alt="" />

              </PicturAndText>
              <TextContainer>
                <AlignText>
                  <Hope1>願景</Hope1>
                  <Slogan>Let's Play <Span>Dream</Span></Slogan>
                </AlignText>
                <Contants>
                  我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起&ensp;<Span2>Let's Play！</Span2>
                </Contants>
              </TextContainer>
            </TextArea11>
          </HopeContainer>
          <BrandContainer>

            <TextArea>
              <PicturAndText>
                <StartImg1 src={start} alt="" />

              </PicturAndText>

              <TextContainer>
                <AlignText>
                  <Hope1>品牌理念</Hope1>
                  <Slogan>Let's Play <Span>Thinking</Span></Slogan>
                </AlignText>
                <Contants>
                  感受發自內心的快樂，一起來玩吧！<br/>
                  品牌的核心價值在於「讓來到 <Span2>Let's Play</Span2> 的人能發自內心的感受純粹的快樂」，孩子從中獲得專注力與成就感、上班族重新找回喜愛一件事物的單純與雀躍感、長者獲得豐富退休生活的歸屬感。
                </Contants>
              </TextContainer>
            </TextArea>
          </BrandContainer>
        </LeftItems>

        <RightItems>
          <HopeContainer>
            <TextArea2>
              <PicturAndText>
                <StartImg1 src={start} alt="" />
              </PicturAndText>
              <TextContainer>
                <div>
                  <Hope3>使命</Hope3>
                  <Slogan>
                    Let’s Play&ensp;
                    <Span>Goal</Span>
                  </Slogan>
                </div>
                <Contants>
                  我們的使命就是讓你來玩的每一分鐘，都感受到放鬆與樂趣！來到這裡你可以輕鬆的玩、簡單的玩、隨心的玩，享受純粹的快樂！我們也致力於和不同產業領域聯盟合作，碰撞出創意無限的火花，提升整個桌球教學生態體系、創造新的無限可能。
                </Contants>
              </TextContainer>
            </TextArea2>
          </HopeContainer>
          <BrandContainer>

            <TextArea22>
              <TextArea3>
                <PicturAndText>
                  <StartImg1 src={start} alt="" />

                </PicturAndText>
                <TextContainer>
                  <div>
                    <Hope4>教學理念</Hope4>
                    <Slogan>Let’s Play  <Span>Teach</Span></Slogan>
                  </div>
                  <Contants>
                    學習桌球這件事情除了提升球技，我們更享受一起參與課程和遊戲的你們，獲得更多生命中的禮物，像是運動家精神、人生體悟、培養品性和歡笑與汗水。一起養成良好的運動習慣，多一種社交的方式，<Span2>Let's Play</Span2> 希望打破大家對桌球的認知，原來桌球可以在玩樂中學習成長！
                  </Contants>
                </TextContainer>
              </TextArea3>
            </TextArea22>
          </BrandContainer>

        </RightItems>

      </TopArea>
    </Container>

    <IpadConainer>
      <AboutItems>
        <AboutText>關於我們</AboutText>
        <AboutUs>About Us</AboutUs>
      </AboutItems>

      <TextContener1>
        <AlignContener2>
          <StartImg src={start} alt="" />
        </AlignContener2>
        <TextContener>
          <Textcontainer2 >
            <Hope1>願景</Hope1>
            <Slogan>Let's Play <Span>Dream</Span></Slogan>
          </Textcontainer2>
          <Text>
            我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起。
          </Text>
        </TextContener>
      </TextContener1>

      <TextContener1>
        <AlignContener>
          <StartImg src={start} alt="" />

        </AlignContener>
        <TextContener>
          <Textcontainer2 >
            <Hope1>使命</Hope1>
            <Slogan>Let’s Play <Span>Goal</Span></Slogan>
          </Textcontainer2>
          <Text>
            我們的使命就是讓你來玩的每一分鐘，都感受到放鬆與樂趣！來到這裡你可以輕鬆的玩、簡單的玩、隨心的玩，享受純粹的快樂！我們也致力於和不同產業領域聯盟合作，碰撞出創意無限的火花，提升整個桌球教學生態體系、創造新的無限可能。
          </Text>
        </TextContener>
      </TextContener1>

      <TextContener1>
        <AlignContener>
          <StartImg src={start} alt="" />

        </AlignContener>
        <TextContener>
          <Textcontainer2 >
            <Hope1>品牌理念</Hope1>
            <Slogan>Let’s Play <Span>Thinking</Span></Slogan>
          </Textcontainer2>
          <Text>
            感受發自內心的快樂，一起來玩吧！品牌的核心價值在於「讓來到 <Span33>Let's Play</Span33> 的人能發自內心的感受純粹的快樂」，孩子從中獲得專注力與成就感、上班族重新找回喜愛一件事物的單純與雀躍感、長者獲得豐富退休生活的歸屬感。
          </Text>
        </TextContener>
      </TextContener1>

      <TextContener1>
        <AlignContener>
          <StartImg src={start} alt="" />

        </AlignContener>
        <TextContener>
          <Textcontainer2 >
            <Hope1>教學理念</Hope1>
            <Slogan>Let’s Play  <Span>Teach</Span></Slogan>
          </Textcontainer2>
          <Text>
            學習桌球這件事情除了提升球技，我們更享受一起參與課程和遊戲的你們，獲得更多生命中的禮物，像是運動家精神、人生體悟、培養品性和歡笑與汗水。一起養成良好的運動習慣，多一種社交的方式，<Span33>Let’s Play</Span33> 希望打破大家對桌球的認知，原來桌球可以在玩樂中學習成長！
          </Text>
        </TextContener>
      </TextContener1>


    </IpadConainer>

    <MobileContainer>
      <AboutItems>
        <AboutText>關於我們</AboutText>
        <AboutUs>About Us</AboutUs>
      </AboutItems>

      <TextContener>
        <AlignContener2>
          <StartImg src={start} alt="" />
          <Textcontainer2>
            <Hope1>願景</Hope1>
            <Slogan>Let's Play <Span>Dream</Span></Slogan>
          </Textcontainer2>
        </AlignContener2>
        <TextContener>
          <Text>
            我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感！我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起。
          </Text>
        </TextContener>
      </TextContener>

      <TextContener>
        <AlignContener>
          <StartImg src={start} alt="" />
          <Textcontainer2>
            <Hope1>使命</Hope1>
            <Slogan>Let’s Play <Span>Goal</Span></Slogan>
          </Textcontainer2>
        </AlignContener>
        <TextContener>
          <Text>
            我們的使命就是讓你來玩的每一分鐘，都感受到放鬆與樂趣！來到這裡你可以輕鬆的玩、簡單的玩、隨心的玩，享受純粹的快樂！我們也致力於和不同產業領域聯盟合作，碰撞出創意無限的火花，提升整個桌球教學生態體系、創造新的無限可能。
          </Text>
        </TextContener>
      </TextContener>

      <TextContener>
        <AlignContener>
          <StartImg src={start} alt="" />
          <Textcontainer2>
            <Hope1>品牌理念</Hope1>
            <Slogan>Let’s Play <Span>Thinking</Span></Slogan>
          </Textcontainer2>
        </AlignContener>
        <TextContener>
          <Text>
            感受發自內心的快樂，一起來玩吧！品牌的核心價值在於「讓來到 <Span33>Let's Play</Span33> 的人能發自內心的感受純粹的快樂」，孩子從中獲得專注力與成就感、上班族重新找回喜愛一件事物的單純與雀躍感、長者獲得豐富退休生活的歸屬感。
          </Text>
        </TextContener>
      </TextContener>

      <TextContener>
        <AlignContener>
          <StartImg src={start} alt="" />
          <Textcontainer2>
            <Hope1>教學理念</Hope1>
            <Slogan>Let’s Play  <Span>Teach</Span></Slogan>
          </Textcontainer2>
        </AlignContener>
        <TextContener>
          <Text>
            學習桌球這件事情除了提升球技，我們更享受一起參與課程和遊戲的你們，獲得更多生命中的禮物，像是運動家精神、人生體悟、培養品性和歡笑與汗水。一起養成良好的運動習慣，多一種社交的方式，<Span33>Let’s Play</Span33> 希望打破大家對桌球的認知，原來桌球可以在玩樂中學習成長！
          </Text>
        </TextContener>
      </TextContener>




    </MobileContainer>



  </PageContainer>;
};

export default About;
