import React from "react";
import styled from "styled-components";
import halfcircle from "../assets/conTest/halfcircle.png";




// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   @media screen and (min-width: 768px) {
    
  }
`;

const Container = styled.div`
  width:100%;
  height:100%;
  background: rgba(207, 210, 211,0.2);
  display: flex;
  padding-top:80px;
  padding-bottom: 80px;
   @media screen and (min-width: 768px) {
    
  }
  
`;

const HalfcircleImg = styled.img`
  width:100%;
  height:100%;
   @media screen and (min-width: 768px) {
    
  }

`;

const ImgContainer = styled.div`
 z-index:1;
  @media screen and (min-width: 768px) {
    
  }
`;


const TextContainer1 = styled.div`
 width:100%;
 z-index:10;
 display:flex;
 justify-content:space-between;
 margin-top:250px;
  @media screen and (min-width: 768px) {
    
  }
`;

const TextContainer2 = styled.div`
 width:100%;
 z-index:10;
 display:flex;
 justify-content:space-between;
 margin-right:100px;
  @media screen and (min-width: 768px) {
    
  }
`;

const LeftText = styled.div`
  margin-left:-200px;
   @media screen and (min-width: 768px) {
    
  }

`;

const RightText = styled.div`
  @media screen and (min-width: 768px) {
    
  }

`;

const Background = styled.div`
  background: #FFD900;
  border-radius: 28px;
  width:30%;
  @media screen and (min-width: 768px) {
    
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
  @media screen and (min-width: 768px) {
    
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
  @media screen and (min-width: 768px) {
    
  }
`;

const Title3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin-left:40px;
  @media screen and (min-width: 768px) {
    
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
  margin-top:100px;
  @media screen and (min-width: 768px) {
    
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
  @media screen and (min-width: 768px) {
    
  }
  
`;

const TextContainer = styled.div`
 margin-top:100px;
 @media screen and (min-width: 768px) {
  
 }
`;

const TextContainerAll = styled.div`
 display:flex;
 justify-content:space-between;
  @media screen and (min-width: 768px) {
    
  }
`;

/* desktop thw newest info style end */
const ConTest = () => {
  return <PageContainer>
    <Container>
      <ImgContainer>
        <HalfcircleImg src={halfcircle} alt="" />
      </ImgContainer>

    
      <TextContainer1>
        <LeftText>
          <div>
            <Title1>桌球賽事</Title1>
            <Title2>Let’s Play Match</Title2>
          </div>
          <TextContent>比賽可以幫助你們靈活應用桌球小技巧，<br />是很好的自我檢視方式。</TextContent>
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
                由 Let's Play 發出邀請，讓小小選手們有<br />發光表現的舞台。
              </Text>
            </div>
          </TextContainer>

          <TextContainer>
            <Background>
              <Title3>積分賽</Title3>
            </Background>
            <div>
              <Text>
                於台灣桌球積分賽平台刊登，是一個訓練比<br />賽經驗的平台，每一個月最少兩次的比賽。
              </Text>
            </div>
          </TextContainer>

          <TextContainer>
            <Background>
              <Title3>學員盃</Title3>
            </Background>
            <div>
              <Text>
                Let's Play 分店館內學員的定期對內交流<br />比賽，增加小朋友的學習動力和學習成果技巧的靈活運用。
              </Text>
            </div>
          </TextContainer>
        </RightText>
      </TextContainer2>
     

    </Container>
  </PageContainer>;
};

export default ConTest;
