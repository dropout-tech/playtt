import React from "react";
import styled from "styled-components";
import colorcircle from "../assets/recruit/colorCircle.png";


// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   @media screen and (max-width: 768px) {
    
  }
`;

const ColorcircleImg = styled.img`
  width: 580px;
  height:294px;
  margin-top:100px;
 
   @media screen and (max-width: 768px) {
    width: 251px;
    height:127px;
    margin-top:-160px;
  
    
  }
`;

const Container = styled.div`
  display:flex;
  justify-content:flex-end;
  margin-top:101px;
  padding-bottom: 20px;
  
   @media screen and (max-width: 768px) {
    display:flex;
    flex-direction:column;
  }
`;

const ImgContainer = styled.div`
  width:50%;
  display:flex;
  justify-content:flex-end;
  align-items: center;
  margin-bottom:80px;
 
   @media screen and (max-width: 768px) {
   margin-top:120px;
   margin-left:120px;
 

  }
`;

const TextContainer = styled.div`
 width:50%;
 margin-left:143px;
 display:flex;
 justify-content:flex-start;
 /* align-items:center; */
 flex-direction: column;
  @media screen and (max-width: 768px) {
   display:flex;
   width:100%;
   flex-direction:column;
   align-items: center;
   margin-left:0px;
  }
`;

const Title = styled.p`
  font-family: 'Noto Sans TC';
  font-weight: 900;
  font-size: 26px;
  line-height: 56px;
  letter-spacing: 1.04px;
  color: #005CB9;
  margin-left:25px;
  margin-top:-1px;
  
   @media screen and (max-width: 768px) {
    margin-top:16px;
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    letter-spacing: 0.04em;
    color: #005CB9;
    margin-left:20px;
    margin-top:10px;
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
  margin-top:40px;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    text-align: center;
    letter-spacing: 0.04em;
    flex: none;
    order: 0;
    flex-grow: 0;
    margin-top:30px;

  }
`;

const Text2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  margin-top:8px;
  
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    text-align: center;
    letter-spacing: 0.04em;
    color:  #1A1A1A;
    flex: none;
    order: 0;
    flex-grow: 0;
    margin: 16px 0px;

  }
 
`;

const Background = styled.div`
  background: #FFD900;
  border-radius: 28px;
  width: 244px;
  height: 56px;
   @media screen and (max-width: 768px) {
    display:flex;
    align-items: center;
    width: 170px;
    height: 32px;
    margin-left:20px;
  }
`;

const Span = styled.div`
  color: #CFD2D3;
  font-family: 'Noto Sans TC';
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.6px;
  margin-left:-20px;

 

`;

const TextDot = styled.div`
  display:flex;
  margin-left:10px;


`;

const TextArea = styled.div`
  display:flex;
`;

/* desktop thw newest info style end */
const Recruit = () => {
  return <PageContainer>
    <Container>
      <ImgContainer>
        <ColorcircleImg src={colorcircle} alt="" />
      </ImgContainer>
      <TextContainer>
        <Background>
          <Title>＃ 熱烈招募中！</Title>
        </Background>
        <Text>
          <TextArea>
            <Span>・</Span>
            <TextDot>
              讓雙北小朋友有更完善的學習資源<br />
            </TextDot>
          </TextArea>
          <TextArea>
            <Span>・</Span>
            <TextDot>
              推廣桌球讓更多成人共同參與<br />
            </TextDot>
          </TextArea>
        </Text>

        <Text2>
          <TextArea>
            <Span>・</Span>
            <TextDot>
              除館內課程推出也提供外派教練進駐服務<br />
            </TextDot>
          </TextArea>

          <TextArea>
            <Span>・</Span>
            <TextDot>
              補習班 / 幼兒園 /學校社團<br />
            </TextDot>
          </TextArea>

          <TextArea>
            <Span>・</Span>
            <TextDot>
              家裡 / 運動中心 /公司社團 /公家機構<br />
            </TextDot>
          </TextArea>

          <TextArea>
            <Span>・</Span>
            <TextDot>
              休閒運動體系創新合作教案（歡樂 / 技術）<br />
            </TextDot>
          </TextArea>

          <TextArea>
            <Span>・</Span>
            <TextDot>
              公司福委會競技休閒活動
            </TextDot>
          </TextArea>
        </Text2>

        <Text2>
          <TextArea>
            <Span>・</Span>
            <TextDot>
              期望結合不同類別才藝發展多元課程<br />
            </TextDot>
          </TextArea>

          <TextArea>
            <Span>・</Span>
            <TextDot>
              街舞、 兒童舞蹈、 畫畫、音樂等
            </TextDot>
          </TextArea>
        </Text2>

        <Text2>
          <TextArea>
            <Span>・</Span>
            <TextDot>
              桌球趣味比賽協辦<br />
            </TextDot>
          </TextArea>

          <TextArea>
            <Span>・</Span>
            <TextDot>
              乒乓球表演者<br />
            </TextDot>
          </TextArea>

          <TextArea>
            <Span>・</Span>
            <TextDot>
              提供桌球產業教練獨特升遷制度
            </TextDot>
          </TextArea>
        </Text2>
      </TextContainer>
    </Container>

  </PageContainer>;
};

export default Recruit;
