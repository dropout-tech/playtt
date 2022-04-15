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
  @media screen and (max-width: 768px) {
    
  }
`;


const ClassIntroduce = styled.div`
 margin-top:30px;
 width:100%;
 display: flex;
 align-items: center;
 flex-direction: column;
 @media screen and (max-width: 768px) {
    
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
  @media screen and (max-width: 768px) {
    
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
  @media screen and (max-width: 768px) {
    
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
  @media screen and (max-width: 768px) {
    
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
  width:550px;

  @media screen and (max-width: 768px) {
    
  }
`;

const Contant = styled.div`
  width:100%;
  height:100%;
  display:flex;
  flex-direction: column;
  align-items: center; 
  margin-top:-80px;
 
  @media screen and (max-width: 768px) {
    
  }
`;

const Img = styled.img`
  height:414px;
  margin-top:60px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Img2 = styled.img`
  height:414px;
  margin-left:80px;
  margin-top:60px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Explain1 = styled.div`
 width:80%;
 display: flex;
 justify-content: flex-start;
  margin-top:60px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Explain2 = styled.div`
 width:80%;
 display: flex;
 justify-content:space-between;
 @media screen and (max-width: 768px) {
    
  }
`;

const Explain3 = styled.div`
 width:80%;
 display: flex;
 justify-content:space-between;
 @media screen and (max-width: 768px) {
    
  }
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  margin-left:80px;
  margin-top:70px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Background1 = styled.div`
  background: #FFD900;
  border-radius: 28px;
  height:60px;
  text-align:center;
  display:flex;
  justify-content:center;
  width:55%;
  @media screen and (max-width: 768px) {
    
  }
`;
const Background2 = styled.div`
  background: #FFD900;
  border-radius: 28px;
  height:60px;
  text-align:center;
  display:flex;
  justify-content:center;
  width:50%;
  @media screen and (max-width: 768px) {
    
  }
`;
const Background3 = styled.div`
  background: #FFD900;
  border-radius: 28px;
  height:60px;
  text-align:center;
  display:flex;
  justify-content:center;
  width:60%;
  @media screen and (max-width: 768px) {
    
  }
`;

const SpanDot = styled.div`
  color: #CFD2D3;

`;

const DotContainer = styled.div`
 display:flex;
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
            <Background1>
              <ContantTitle>班別課程豐富客製化</ContantTitle>
            </Background1>
            <ContantText>
              <DotContainer>
                <SpanDot>・</SpanDot> 個人班 / 團體班 / 選手班 /親子 / 包班<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 幼兒 / 兒童 / 國高中 / 大學/ 成人 / 銀髮<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 小班客製化教學 / 大班休閒娛樂教學<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 冬令營 / 夏令營 / 多元冬夏令營
              </DotContainer>
            </ContantText>
          </Text>
        </Explain1>

        <Explain2>
          <Text>
            <Background2>
              <ContantTitle>
                寓教於樂多元發展
              </ContantTitle>
            </Background2>

            <ContantText>
              <DotContainer>
                <SpanDot>・</SpanDot> 暖身做操 & 趣味體適能桌球<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 互動遊戲式球感<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 對打練習<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 互動單球調整揮拍動作<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 遊戲競賽<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot>學習到球技 / 學習態度 / 品性 / 運動家精神 / 獲得體悟
              </DotContainer>
            </ContantText>
          </Text>
          <Img2 src={img2} alt="" />
        </Explain2>


        <Explain3>
          <Img src={img3} alt="" />
          <Text>
            <Background3>
              <ContantTitle>伴你一生的全年齡運動</ContantTitle>
            </Background3>

            <ContantText>
              <DotContainer>
                < SpanDot>・</SpanDot> 培養專注力 / 耐挫力 / 肌耐力 / 體能<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 肢體協調 / 遠離 3C<br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> 兒童腦部發育 / 成人腦部健全發展<br />
              </DotContainer>
              <DotContainer>
                <SpanDot>・</SpanDot> 培養良好運動習慣與社交能力<br />
              </DotContainer>
              <DotContainer>
                <SpanDot>・</SpanDot> 預防老人智力退化
              </DotContainer>
            </ContantText>
          </Text>
        </Explain3>
      </Contant>
    </Container>
  </PageContainer>;
};

export default Classes;
