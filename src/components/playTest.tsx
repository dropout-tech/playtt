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
  justify-content:center;
  padding-top:180px;
  padding-bottom: 80px;
  padding-left:24px;
  padding-right:24px;
   @media screen and (max-width: 768px) {
    display: none;
  }
`;

const TextContainer = styled.div`
 
 @media screen and (max-width: 768px) {
   margin-top:-20px;
  }


`;

const Text1 = styled.div`
 @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
    align-items: center;
    margin-top:20px;
  }
`;

const Text2 = styled.div`
  margin-top:80px;
 @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    align-items:center;
    flex-direction: column;
    margin-top:-36px;
   
  }
`;

const Text3 = styled.div`
 margin-top:-20px;
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
  margin:0px;
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
  margin-top:8px;
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
    margin-top:0px;
    

  }
`;

const Title3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.03em;
  color: #1A1A1A;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    letter-spacing: 0.02em;
    color: #1A1A1A;
    margin-top:50px;
    margin-bottom:32px;

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
  margin-top:-40px;
   @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-weight: 700;
    font-size: 18px;
    line-height: 32px;
    letter-spacing: 0.04em;
  }
`;

const Number2 = styled.span`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:-52px;
   @media screen and (max-width: 768px) {
    padding-left:12px;
  }
`;

const TextContent = styled.div`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  width:517px;
  margin-top:30px;
   @media screen and (max-width: 768px) {
   width:100%;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 500;
   font-size: 16px;
   line-height: 30px;
   text-align: justify;
   letter-spacing: 0.02em;
   color: #1A1A1A; 
   display:flex;
   justify-content: center;
   margin-top:12px;
   position: relative;
   z-index:10;
   padding-left:24px;
   padding-right:24px;
   margin-top:-4px;

  }
`;

const TestpicImg = styled.img`
  width:580px;
  height:593px;
  display:flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-left:103px;
  
`;

const MobileImg = styled.img`
  @media screen and (max-width: 768px) {
    width:251px;
    height:256px;
    display:flex;
    justify-content: center;
    align-items: center;
    margin-top:100px;
    margin-bottom:40px;
    margin-left:0px;
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
  margin-left:12px;

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
  margin-top:-44px;
  padding:24px;

 @media screen and (min-width: 768px) {
    display:none;
  }
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

const ImgContainer = styled.div`
    @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    align-items:center;
  }
`;

const TreeItems = styled.div`
   @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    align-items:flex-start;
    flex-direction: column;
  }

`;

/* desktop thw newest info style end */
const PlayTest = () => {
  return <PageContainer id="playTest">
    <Container>
      <TextContainer>
        <Text1>
          <Title1>桌球檢定</Title1>
          <Title2>Let's Play Test</Title2>
        </Text1>
        <Text2>
          <Title3><Span>Let's Play </Span>獨家精心規劃專屬檢定，結合</Title3>
          <Number> 1.<Text123>品勢 —— 揮拍姿勢</Text123></Number>
          <Number2>2.<Text123>筆試 —— 桌球知識</Text123></Number2>
          <Number2>3.<Text123>體能 —— 敏捷反應</Text123></Number2>
        </Text2>
        <Text3>
          <TextContent>
            設計成<Span> L1–L12 </Span>檢定關卡，最後一關還有模擬比賽。
            教學內容搭配好玩的教案，讓大家在樂趣中成長，
            用來幫助大小朋友測驗學習技術成果。
            你意想不到的玩桌球，也可以學到、揮灑汗水、歡笑滿滿！
          </TextContent>
        </Text3>
      </TextContainer>

      <TestpicImg src={testpic} alt="" />

    </Container>

    <MobileContainer>
      <ImgContainer> 
        <MobileImg src={testpic} alt="" />
      </ImgContainer>
     

      <TextContainer>
        <Text1>
          <Title1>桌球檢定</Title1>
          <Title2>Let's Play Test</Title2>
        </Text1>
        <Text2>
          <Title3><Span> Let's Play </Span>  獨家精心規劃專屬檢定，結合</Title3>
          <TreeItems>
            <Number>1.<Text123>品勢 —— 揮拍姿勢</Text123></Number>
            <Number>2.<Text123>筆試 —— 桌球知識</Text123></Number>
            <Number>3.<Text123>體能 —— 敏捷反應</Text123></Number>
          </TreeItems>
        </Text2>
        <Text3>
          <TextContent>
            <p>
              設計成 <Span>L1–L12 </Span> 檢定關卡，最後一關還有模擬比賽。
              教學內容搭配好玩的教案，讓大家在樂趣中成長，
              用來幫助大小朋友測驗學習技術成果。
              你意想不到的玩桌球，也可以學到、揮灑汗水、歡笑滿滿！
            </p>
            
          </TextContent>
        </Text3>
      </TextContainer>



    </MobileContainer>

  </PageContainer>;
};

export default PlayTest;
