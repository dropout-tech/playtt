import React from "react";
import styled from "styled-components";
import img1 from "../assets/classes/img1.png";
import img2 from "../assets/classes/img2.png";
import img3 from "../assets/classes/img3.png";

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
  width:100%;
`;


const ClassIntroduce = styled.div`

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
`;

const ContantTitle = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #005CB9;
  background: #FFD900;
  border-radius: 28px;
  height:56px;
  width:60%;
`;


const ContantText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #CFD2D3;
  width:413px;
  height:144px;
`;

const Contant = styled.div`
  display:flex;
  justify-content:center;
  flex-direction: column;

`;

const Img1 = styled.img`
  width:414px;
  height:352px;

`;

const Explain1 = styled.div`
 width:45%;
 display: flex;
 justify-content:space-between;
 
`;

const Explain2 = styled.div`
 width:45%;
 display: flex;
 justify-content:space-between;
 
`;

const Explain3 = styled.div`
 width:45%;
 display: flex;
 justify-content:space-between;
 
`;


const Text = styled.div`
  display: flex;
  flex-direction: column;
 
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
          <Img1 src={img1} alt="" />

          <Text>
            <ContantTitle>班別課程豐富客製化</ContantTitle>

            <ContantText>
              ・ 個人班 / 團體班 / 選手班 / 親子 / 包班
              ・ 幼兒 / 兒童 / 國高中 / 大學 / 成人 / 銀髮
              ・ 小班客製化教學 / 大班休閒娛樂教學
              ・ 冬令營 / 夏令營 / 多元冬夏令營
            </ContantText>

          </Text>

        </Explain1>

        <Explain2>
          <Img1 src={img1} alt="" />

          <Text>
            <ContantTitle>寓教於樂多元發展</ContantTitle>

            <ContantText>
              ・ 暖身做操 & 趣味體適能桌球
              ・ 互動遊戲式球感
              ・ 對打練習
              ・ 互動單球調整揮拍動作
              ・ 遊戲競賽
              ・ 學習到球技 / 學習態度 / 品性 / 運動家精神 / 獲得體悟
            </ContantText>

          </Text>

        </Explain2>

        <Explain3>
          <Img1 src={img1} alt="" />

          <Text>
            <ContantTitle>伴你一生的全年齡運動</ContantTitle>

            <ContantText>
              ・ 培養專注力 / 耐挫力 / 肌耐力 / 體能
              ・ 肢體協調 / 遠離 3C
              ・ 兒童腦部發育 / 成人腦部健全發展
              ・ 培養良好運動習慣與社交能力
              ・ 預防老人智力退化
            </ContantText>

          </Text>

        </Explain3>




      </Contant>



    </Container>


  </PageContainer>;
};

export default Classes;
