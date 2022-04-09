import React from "react";
import styled from "styled-components";
import testpic from "../assets/playTest/testpic.png";



// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
  width: 100%;
  height:100%;
  display:flex;
  justify-content: center;
`;

const TextContainer = styled.div`
  

`;

const Text1 = styled.div`

`;

const Text2 = styled.div`

`;

const Text3 = styled.div`
  <width:100></width:100>%;
  height:144px;
`;

const Title1 = styled.p`

`;

const Title2 = styled.p`

`;

const Title3 = styled.p`

`;

const Number = styled.p`

`;

const TextContent = styled.p`

`;

const TestpicImg = styled.img`
  width:580px;
  height:593px;

`;

const Span = styled.span`

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

      <div>
        <TestpicImg src={testpic} alt="" />
      </div>


    </Container>

  </PageContainer>;
};

export default PlayTest;
