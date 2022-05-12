import React from "react";
import styled from "styled-components";
import colorpic from "../assets/story/colorpic.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   @media screen and (max-width: 768px) {
    
  }
  
`;

const ColorpicImg = styled.img`
  width:517px ;
  height:517px ;
  
  margin-top:100px;

   @media screen and  (max-width: 768px) {
     width:251px ;
     height:251px ;
  }
`;

const Container = styled.div`
 width:100% ;
 height:920px;
 display:flex;
 background:#F5F6F6;
 padding-bottom:70px;
  @media screen and  (max-width: 768px) {
    display:flex;
    flex-direction:column;
    margin-top:-40px;
 
  
  }
`;

const Picture = styled.div`
  width:50%;
  display:flex;
  justify-content:flex-end;
  align-items:center;
  margin-right:103px;
;



   @media screen and  (max-width: 768px) {
    width:50%;
    display:flex;
    justify-content:center;
    margin-top:-30px;
    margin-left:50px;
 
  }


`;

const Text = styled.p`
  width:50%;
  display:flex;
  justify-content:center;
  flex-direction: column;
  align-items: flex-start;
  margin:100px 0px 0px 0px
  
  margin-bottom:30px;
   @media screen and  (max-width: 768px) {
    margin-top:30px;
    margin-left:60px;

  }
`;

const Title1 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin:0px;
   @media screen and  (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    text-align: center;
    letter-spacing: 0.03em;
    color: #1A1A1A;
    margin-left:60px;

  }
`;

const Title2 = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin:4px 0px 0px 0px;
  @media screen and  (max-width: 768px) {
   width:250px;
   font-family: 'Futura';
   font-style: normal;
   font-weight: 700;
   font-size: 18px;
   line-height: 32px;
   text-align: center;
   letter-spacing: 0.04em;
   color: #1A1A1A;
   margin-left:10px;
   margin-top:-20px;
  }
`;

const Title3 = styled.p`
  font-family: 'Futura';
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 1.04px;
  margin:0px;
  
 @media screen and  (max-width: 768px) {
    font-size: 20px;
    line-height: 36px;
    text-align: center;
    letter-spacing: 0.03em;
    color: #1A1A1A;
  }
  

`;

const Title4 = styled.p`
  font-family: 'Noto Sans TC';
  font-weight: 900;
  font-size: 26px;
  margin:-13px 0px 0px 0px;

   @media screen and  (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 20px;
    line-height: 36px;
    text-align: center;
    letter-spacing: 0.03em;
    color: #1A1A1A;

  }

`;

const Contant = styled.p`
  width:517px;
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  margin:24px 0px 0px 0px;

   @media screen and  (max-width: 768px) {
    width:327px;
    height:240px;
    display:flex;
    margin-left:-25px;
    font-family: 'Futura';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    text-align: justify;
    letter-spacing: 0.02em;
    color: #1A1A1A;

  }
`;

const Contant2 = styled.p`
  width:517px;
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  margin:0px;
   @media screen and  (max-width: 768px) {
    width:327px;
    height:240px;
    margin-top:40px;
    margin-left:-25px;
    font-family: 'Futura';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    text-align: justify;
    letter-spacing: 0.02em;
    color: #1A1A1A;

  }
`;

const BelowText = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin:40px 210px 0px 0px;
   @media screen and  (max-width: 768px) {
    margin-top:70px;
    width:300px
  }
`;

const Span1 = styled.span`
  color:#38D430;
  font-family: 'Noto Sans TC';
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 1.04px;
   @media screen and  (max-width: 768px) {
    
  }
`;

const Span2 = styled.span`
  color:#FF40B4;
  font-family: 'Noto Sans TC';
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 1.04px;
   @media screen and  (max-width: 768px) {
    
  }
`;



/* desktop thw newest info style end */
const Story = () => {
  return <PageContainer>
    <Container>
      <Picture>
        <ColorpicImg src={colorpic} alt="" />
      </Picture>


      <Text>
        <div>
          <Title1>我們的故事</Title1>
          <Title2>Let’s Play Story</Title2>
          <Contant>Let's Play 創立於 2018 年，創辦人阿寬教練畢業於桌球名校麗山國中與松山家商，大學時期深受林學宜教授的啟發，非常懂得職業球員訓練的辛苦，但他其實更想分享給大家的是，如何和大家快樂的「玩」桌球，一起感受其中的樂趣！小孩子來到這裡可以培養信心與專注力、上班族可以擁有用運動釋放壓力的時光、年長者可以實現豐富退休生活的樂趣！</Contant>

          <Contant2>我們期望讓人感受像是回到家一般的親切，教練們如同鄰居大哥哥一樣帶著大家一起玩！根據不同水平慢慢地引導，用簡單的口訣輕鬆的氣氛中自然而然地上手，原來，桌球一點也不難！此外，從桌球同業的夥伴聯盟合作與跨領域的異業結合，到建立桌球教練創業輔導的平台，甚至邀請名人一起玩桌球，越來越多的創意可能性等著我們去實現！</Contant2>
        </div>

        <BelowText>
          <Title3>Let's Play <Span1>運動</Span1> X <Span2>創新</Span2></Title3>
          <Title4>邀請大家一起來玩！</Title4>
        </BelowText>
      </Text>


    </Container>





  </PageContainer>;
};

export default Story;
