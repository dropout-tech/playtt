import React from "react";
import styled from "styled-components";
import img1 from "../assets/classes/img1.png";
import img2 from "../assets/classes/img2.png";
import img3 from "../assets/classes/img3.png";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  @media screen and (min-width: 768px) {
    
  }
`;

const Container = styled.div`
  width:100%;
  height:100%;
  padding-top:80px;
  padding-bottom:80px;
  @media screen and (min-width: 768px) {
    
  }
`;


const ClassIntroduce = styled.div`
 margin-top:30px;
 width:100%;
 display: flex;
 align-items: center;
 flex-direction: column;
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
  margin-top:-10px;
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
  margin-top:-30px;
  line-Height:52px;
  @media screen and (min-width: 768px) {
    
  }
`;

const ContantTitle = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  align-items: center;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin-top:10px;
  @media screen and (min-width: 768px) {
    
  }
`;

const ContantText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  width:300px;
  @media screen and (min-width: 768px) {
    
  }
`;

const Contant = styled.div`
  width:100%;
  height:100%;
  display:flex;
  flex-direction: column;
  justify-content: center;
  align-items: center; 
  margin-top:-80px;
  @media screen and (min-width: 768px) {
    
  }
`;

const Img = styled.img`
  height:300px;
  margin-top:60px;
  @media screen and (min-width: 768px) {
    
  }
`;

const Img2 = styled.img`
  height:300px;
  margin-left:80px;
  margin-top:60px;
  @media screen and (min-width: 768px) {
    
  }
`;

const Explain1 = styled.div`
 width:45%;
 display: flex;
 justify-content: flex-start;
  margin-top:60px;
  @media screen and (min-width: 768px) {
    
  }
`;

const Explain2 = styled.div`
 width:45%;
 display: flex;
 justify-content:space-between;
 @media screen and (min-width: 768px) {
    
  }
`;

const Explain3 = styled.div`
 width:45%;
 display: flex;
 justify-content:space-between;
 @media screen and (min-width: 768px) {
    
  }
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  margin-left:80px;
  margin-top:70px;
  @media screen and (min-width: 768px) {
    
  }
`;

const Background = styled.div`
  background: #FFD900;
  border-radius: 28px;
  height:56px;
  text-align:center;
  width:110%;
  @media screen and (min-width: 768px) {
    
  }
`;







/* desktop thw newest info style end */
const Classes = () => {
  return <PageContainer>
    <Container>

      <ClassIntroduce>
        <Title1>課程介紹</Title1>
        <Title2>Our Class</Title2>
      </ClassIntroduce>

      <Contant>

        <Explain1>
          <Img src={img1} alt="" />
          <Text>
            <Background>
              <ContantTitle>班別課程豐富客製化</ContantTitle>
            </Background>
            <ContantText>
              ・ 個人班 / 團體班 / 選手班 /  &emsp; 親子 / 包班<br />
              ・ 幼兒 / 兒童 / 國高中 / 大學  &emsp; / 成人 / 銀髮<br />
              ・ 小班客製化教學 / 大班休閒 &emsp; 娛樂教學<br />
              ・ 冬令營 / 夏令營 / 多元冬夏 &emsp; 令營
            </ContantText>
          </Text>
        </Explain1>

        <Explain2>
          <Text>
            <Background>
              <ContantTitle>
                寓教於樂多元發展
              </ContantTitle>
            </Background>

            <ContantText>
              ・ 暖身做操 & 趣味體適能桌球<br />
              ・ 互動遊戲式球感<br />
              ・ 對打練習<br />
              ・ 互動單球調整揮拍動作<br />
              ・ 遊戲競賽<br />
              ・ 學習到球技 / 學習態度 /  品<br /> &emsp; 性 / 運動家精神 / 獲得體悟
            </ContantText>
          </Text>
          <Img2 src={img2} alt="" />
        </Explain2>


        <Explain3>
          <Img src={img3} alt="" />
          <Text>
            <Background>
              <ContantTitle>伴你一生的全年齡運動</ContantTitle>
            </Background>

            <ContantText>
              ・ 培養專注力 / 耐挫力 / 肌耐<br /> &emsp; 力 / 體能<br />
              ・ 肢體協調 / 遠離 3C<br />
              ・ 兒童腦部發育 / 成人腦部健<br /> &emsp; 全發展<br />
              ・ 培養良好運動習慣與社交能力<br />
              ・ 預防老人智力退化
            </ContantText>
          </Text>
        </Explain3>
      </Contant>
    </Container>
  </PageContainer>;
};

export default Classes;
