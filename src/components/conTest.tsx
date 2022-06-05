import React from "react";
import styled from "styled-components";
import halfcircle from "../assets/conTest/halfcircle.png";
import circle from "../assets/conTest/circle.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   @media screen and (max-width: 768px) {
 
  }
`;

const Container = styled.div`
  width:100%;
  height:804px;
  background: rgba(207, 210, 211,0.2);
  display: flex;
  justify-content:center;
  align-items:center;
  margin-top:80px;
  background-image: url('${halfcircle}');
  background-size: cover;
  
  ;
   @media screen and (max-width: 768px) {
    display:none;

  }

`;

// const HalfcircleImg = styled.img`
//   width:100%;
//   height:100%;
//   z-index:1;
//    @media screen and (max-width: 768px) {

//   }

// `;

const ImgContainer = styled.div`
 z-index:1;
  @media screen and (max-width: 768px) {
 
  }
`;


const TextContainer1 = styled.div`
 width:100%;
 z-index:10;
 display:flex;
 align-items: flex-end;
 flex-direction: column;
 margin-top:-7px;
  @media screen and (max-width: 768px) {
    margin-top:120px;
    align-items: center;
  }
`;

const TextContainer2 = styled.div`
 width:100%;
 z-index:10;
 display:flex;
 justify-content:flex-start;
 align-items: center;
 margin-right:150px;
 margin-left:143px;
 margin-top:-60px;
 
  @media screen and (max-width: 768px) {
    margin-top:-24px;
    justify-content:center;
    margin-left:-25px;
    margin-top:-7px;
    margin-bottom:65px;
  }
`;

const LeftText = styled.div`
  margin-left:-180px;
   @media screen and (max-width: 768px) {
    z-index:10;
    margin-top:-240px;
    margin-left:20px;
  }

`;

const RightText = styled.div`
  @media screen and (max-width: 768px) {
    
  }

`;

const Background = styled.div`
  background: #FFD900;
  border-radius: 28px;
  width:129px;
  height:56px;
  margin-top:-70px;
  @media screen and (max-width: 768px) {
    width:96px;
    height:44px;
    margin-top:20px;
    margin-left:30px;
  }
   
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
  display:flex;
  justify-content: flex-start;
  @media screen and (max-width: 768px) {
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
    margin-left:-10px;


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
  display:flex;
  justify-content: flex-start;
  line-Height:52px;
  margin-top:-28px;
  @media screen and (max-width: 768px) {
   margin-left:-80px;
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
   margin-top:-26px;
  }
`;

const Title3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 56px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin:0px 0px 0px 24px;
  


  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    letter-spacing: 0.04em;
    color: #005CB9;
    margin-top:5px;
    margin-left:20px;

  }
`;

const TextContent = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  text-align: justify;
  letter-spacing: 0.04em;
  color: #3C3D3D;
  margin-top:80px;
  width:477px;
  @media screen and (max-width: 768px) {
    font-size: 20px;
    line-height: 36px;
    display: flex;
    align-items: center;
    justify-content:center;
    text-align: center;
    letter-spacing: 0.03em;
    color: #3C3D3D;
    transform: matrix(1, 0, 0, 1, 0, 0);
    margin-top:40px;
    width:340px;
    margin-left:-20px;

  }
  
`;

const Text = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  width:374px;
  margin:24px 0px 0px 0px;
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    text-align: justify;
    letter-spacing: 0.02em;
    color: #1A1A1A;
    width:211px;
    margin:15px 0px -5px 20px;
    
  }
  
`;

const TextContainer = styled.div`
 margin-top:130px;
 @media screen and (max-width: 768px) {
  display:flex;
  margin-top:10px;
 }
`;

const MobileContainer = styled.div`
  margin-top:54px;
  width:100%;
  height:100%;
  background: rgba(207, 210, 211,0.2);
  display: flex;
  flex-direction: column;
 @media screen and (min-width: 768px) {
  display:none;
 }
`;


const CircleImg = styled.img`
  width:100%;
  height:200px;
  margin-top:-100px;
  display:flex;
  align-items: center;
  position: relative;
  z-index:1;

@media screen and (max-width: 768px) {
  
}
`;

const Ball = styled.div`
  @media screen and (max-width: 768px) {
   margin-left:110px;
   margin-top:-20px;
  }


`;

const AlignText = styled.div`
 display:flex;
 justify-content: center;
 align-items: center;
 margin-left:330px;
`;

const Span = styled.span`
  font-family: 'Futura';
  font-weight:500;
  font-size:20px;
  line-height:36px;
  letter-spacing:3%;
  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-weight:500;
    font-size:16px;
    line-height:30px;
    letter-spacing:2%;
  }
`;

/* desktop thw newest info style end */
const ConTest = () => {
  return <PageContainer>
    <Container>

      <AlignText>
        <TextContainer1>
          <LeftText>
            <div>
              <Title1>桌球賽事</Title1>
              <Title2>Let’s Play Match</Title2>
            </div>
            <TextContent>比賽可以幫助你們靈活應用桌球小技巧，是很好的自我檢視方式。</TextContent>
          </LeftText>
        </TextContainer1>


        <TextContainer2>
          <RightText>
            <TextContainer>
              <Background>
                <Title3>邀請賽</Title3>
              </Background>
              <div>
                <Text>
                  由 <Span>Let's Play</Span> 發出邀請，讓小小選手們有發光表現的舞台。
                </Text>
              </div>
            </TextContainer>

            <TextContainer>
              <Background>
                <Title3>積分賽</Title3>
              </Background>
              <div>
                <Text>
                  於台灣桌球積分賽平台刊登，是一個訓練比賽經驗的平台，每一個月最少兩次的比賽。
                </Text>
              </div>
            </TextContainer>

            <TextContainer>
              <Background>
                <Title3>學員盃</Title3>
              </Background>
              <div>
                <Text>
                  <Span>Let's Play</Span> 分店館內學員的定期對內交流比賽，增加小朋友的學習動力和學習成果技巧的靈活運用。
                </Text>
              </div>
            </TextContainer>
          </RightText>
        </TextContainer2>
      </AlignText>

    </Container>

    <MobileContainer>
      <ImgContainer>
        <CircleImg src={circle} alt="" />
      </ImgContainer>

      <TextContainer1>
        <LeftText>
          <Ball>
            <Title1>桌球賽事</Title1>
            <Title2>Let’s Play Match</Title2>
          </Ball>
          <TextContent>比賽可以幫助你們靈活應用桌球小技巧，是很好的自我檢視方式。</TextContent>
        </LeftText>
      </TextContainer1>


      <TextContainer2>
        <RightText>
          <TextContainer>
            <Background>
              <Title3>邀請賽</Title3>
            </Background>
            <div>
              <Text>
                由<Span>Let's Play</Span> 發出邀請，讓小小選手們有發光表現的舞台。
              </Text>
            </div>
          </TextContainer>

          <TextContainer>
            <Background>
              <Title3>積分賽</Title3>
            </Background>
            <div>
              <Text>
                於台灣桌球積分賽平台刊登，是一個訓練比賽經驗的平台，每一個月最少兩次的比賽。
              </Text>
            </div>
          </TextContainer>

          <TextContainer>
            <Background>
              <Title3>學員盃</Title3>
            </Background>
            <div>
              <Text>
                <Span>Let's Play</Span> 分店館內學員的定期對內交流比賽，增加小朋友的學習動力和學習成果技巧的靈活運用。
              </Text>
            </div>
          </TextContainer>
        </RightText>
      </TextContainer2>


    </MobileContainer>
  </PageContainer>;
};

export default ConTest;
