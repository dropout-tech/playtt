import React from "react";
import styled from "styled-components";
import testpic from "../assets/playTest/testpic.png";



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
  display:flex;
  justify-content: space-around;
  margin-left:80px;
  padding-top:80px;
  padding-bottom: 80px;
   @media screen and (max-width: 768px) {
    display: none;
  }
`;

const TextContainer = styled.div`
 @media screen and (max-width: 768px) {
    
  }


`;

const Text1 = styled.div`
 @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
    align-items: center;
  }
`;

const Text2 = styled.div`
 @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
    padding-left:30px;
    margin-top:-50px;
  }
`;

const Text3 = styled.div`
   @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
    align-items: center;
  }
`;

const Title1 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 36px;
  line-height: 52px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
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

  }
`;

const Title2 = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  line-Height:52px;
   @media screen and (max-width: 768px) {
    margin-top:-25px;
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
    

  }
`;

const Title3 = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.03em;
  color: #1A1A1A;
   @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    text-align: justify;
    letter-spacing: 0.02em;
    color: #1A1A1A;
    margin-top:50px;
    margin-left:18px;

  }
`;

const Number = styled.span`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
   @media screen and (max-width: 768px) {
    padding-left:12px;
  }
`;

const TextContent = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;
   @media screen and (max-width: 768px) {
   padding-left:0px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 500;
   font-size: 16px;
   line-height: 30px;
   text-align: justify;
   letter-spacing: 0.02em;
   color: #1A1A1A; 
   width:327px;
   display:flex;
   justify-content: center;
   margin-top:20px;

  }
`;

const TestpicImg = styled.img`
  width:505px;
  height:500px;
  margin-right:100px;
  margin-top:100px;
   @media screen and (max-width: 768px) {
    width:251px;
    height:256px;
    margin-left:100px;
    margin-right:0px;
    
    
  }
`;

const Text123 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #005CB9;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 0.03em;
    color: #005CB9;

  }
`;



const MobileContainer = styled.div`
  margin-top:-120px;
 
 @media screen and (min-width: 768px) {
    display:none;
  }
`;

/* desktop thw newest info style end */
const PlayTest = () => {
  return <PageContainer>
    <Container>
      <TextContainer>
        <Text1>
          <Title1>桌球檢定</Title1>
          <Title2>Let's Play Test</Title2>
        </Text1>
        <Text2>
          <Title3>Let's Play 獨家精心規劃專屬檢定，結合</Title3>
          <Number>1.<Text123>品勢 —— 揮拍姿勢</Text123></Number>
          <Number>2.<Text123>筆試 —— 桌球知識</Text123></Number>
          <Number>3.<Text123>體能</Text123></Number>
        </Text2>
        <Text3>
          <TextContent>
            設計成 L1–L12 檢定關卡，最後一關還有模擬比賽。<br />
            教學內容搭配好玩的教案，讓大家在樂趣中成長，<br />
            用來幫助大小朋友測驗學習技術成果。<br />
            你意想不到的玩桌球，也可以學到、揮灑汗水、歡笑滿滿！
          </TextContent>
        </Text3>
      </TextContainer>

      <TestpicImg src={testpic} alt="" />

    </Container>

    <MobileContainer>
      <TestpicImg src={testpic} alt="" />

      <TextContainer>
        <Text1>
          <Title1>桌球檢定</Title1>
          <Title2>Let's Play Test</Title2>
        </Text1>
        <Text2>
          <Title3>Let's Play 獨家精心規劃專屬檢定，結合</Title3>
          <Number>1.<Text123>品勢 —— 揮拍姿勢</Text123></Number>
          <Number>2.<Text123>筆試 —— 桌球知識</Text123></Number>
          <Number>3.<Text123>體能</Text123></Number>
        </Text2>
        <Text3>
          <TextContent>
            設計成 L1–L12 檢定關卡，最後一關還有模擬比賽。<br />
            教學內容搭配好玩的教案，讓大家在樂趣中成長，<br />
            用來幫助大小朋友測驗學習技術成果。<br />
            你意想不到的玩桌球，也可以學到、揮灑汗水、歡笑滿滿！
          </TextContent>
        </Text3>
      </TextContainer>



    </MobileContainer>

  </PageContainer>;
};

export default PlayTest;
