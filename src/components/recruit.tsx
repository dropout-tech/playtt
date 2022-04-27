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
    margin-left:-25px;
    
  }
`;

const Container = styled.div`
  display:flex;
  justify-content:center;
  padding-top:80px;
  padding-bottom: 80px;
   @media screen and (max-width: 768px) {
    display:flex;
    flex-direction:column;
  }
`;

const ImgContainer = styled.div`
  width:50%;
  display:flex;
  justify-content:flex-end;
  margin-left:100px;
  margin-top:100px;
   @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;

  }
`;

const TextContainer = styled.div`
 width:50%;
 margin-left:100px;
  @media screen and (max-width: 768px) {
   display:flex;
   width:100%;
   flex-direction:column;
   align-items: center;
   margin-left:0px;
  }
`;

const Title = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin-left:25px;
  padding-top:8px;
   @media screen and (max-width: 768px) {
    margin-top:16px;
    font-family: 'Futura';
font-style: normal;
font-weight: 700;
font-size: 18px;
line-height: 32px;
/* identical to box height, or 178% */

display: flex;
align-items: center;
letter-spacing: 0.04em;

/* primary blue */

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
  margin-top:60px;
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
    margin: 16px 0px;

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
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
font-style: normal;
font-weight: 500;
font-size: 16px;
line-height: 32px;
/* or 200% */

text-align: center;
letter-spacing: 0.04em;

/* secondary gray */

color:  #1A1A1A;


/* Inside auto layout */

flex: none;
order: 0;
flex-grow: 0;
margin: 16px 0px;

  }
 
`;

const Background = styled.div`
  background: #FFD900;
  border-radius: 28px;
  width: 247px;
  height: 56px;
   @media screen and (max-width: 768px) {
    display:flex;
    align-items: center;
    width: 170px;
    height: 32px;
    margin-left:20px;
  }
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
          ・ 讓雙北小朋友有更完善的學習資源<br />
          ・ 推廣桌球讓更多成人共同參與<br />
        </Text>

        <Text2>
          ・ 除館內課程推出也提供外派教練進駐服務<br />
          ・ 補習班 / 幼兒園 /學校社團<br />
          ・ 家裡 / 運動中心 /公司社團 /公家機構<br />
          ・ 休閒運動體系創新 合作教案（歡樂 / 技術）<br />
          ・ 公司福委會競技休閒活動
        </Text2>

        <Text2>
          ・ 期望結合不同類別才藝發展多元課程<br /> &emsp; 街舞、 兒童舞蹈、 畫畫、音樂等
        </Text2>

        <Text2>
          ・ 桌球趣味比賽協辦<br />
          ・ 乒乓球表演者<br />
          ・ 提供桌球產業教練<br /> &emsp; 獨特升遷制度
        </Text2>
      </TextContainer>
    </Container>

  </PageContainer>;
};

export default Recruit;
