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
    
  }
`;

const TextContainer = styled.div`
 @media screen and (max-width: 768px) {
    
  }


`;

const Text1 = styled.div`
 @media screen and (max-width: 768px) {
    
  }
`;

const Text2 = styled.div`
 @media screen and (max-width: 768px) {
    
  }
`;

const Text3 = styled.div`
  width:100;
  height:144px;
   @media screen and (max-width: 768px) {
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
    
  }
`;

const Number = styled.p`
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
    
  }
`;

const TestpicImg = styled.img`
  width:505px;
  height:500px;
  margin-right:100px;
  margin-top:100px;
   @media screen and (max-width: 768px) {
    
  }
`;

const Span = styled.span`
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
          <Number>1.<Span>品勢 —— 揮拍姿勢</Span></Number>
          <Number>2.<Span>筆試 —— 桌球知識</Span></Number>
          <Number>3.<Span>體能</Span></Number>
        </Text2>
        <Text3>
          <TextContent>
            設計成 L1–L12 檢定關卡，最後一關還有模擬比賽。<br/>
            教學內容搭配好玩的教案，讓大家在樂趣中成長，<br />
            用來幫助大小朋友測驗學習技術成果。<br/>
            你意想不到的玩桌球，也可以學到、揮灑汗水、歡笑滿滿！
          </TextContent>
        </Text3>
      </TextContainer>

      <TestpicImg src={testpic} alt="" />
      
    </Container>

  </PageContainer>;
};

export default PlayTest;
