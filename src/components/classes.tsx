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
  padding-top:140px;
  padding-bottom:80px;
  margin-left:60px;
  display:flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  @media screen and (max-width: 768px) {
   margin-top:-80px;
   margin-left:0px;
  }
`;


const ClassIntroduce = styled.div`
 margin-top:30px;
 width:100%;
 display: flex;
 align-items: center;
 justify-content:center;
 flex-direction: column;
 margin-left:-120px;
 @media screen and (max-width: 768px) {
   margin-left:0px;
 
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
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color:#1A1A1A
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

const ContantTitle = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height:10px;
  display:flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #005CB9;
 
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    letter-spacing: 0.04em;
    color: #005CB9;
    margin-top:20px;
  }
`;

const ContantText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  width:550px;
  margin-top:40px;


  @media screen and (max-width: 768px) {
    width: 327px;
    display:flex;
    flex-direction: column;
    align-items: center;
    line-height: 22px;
  }
`;

const Contant = styled.div`
  width:100%;
  height:100%;
  display:flex;
  flex-direction: column;
  align-items: center; 
  margin-top:4px;
 
  @media screen and (max-width: 768px) {
    margin-top:-30px;
  }
`;

const Img = styled.img`
  width:414px;
  height:352px;
  margin-top:60px;

  @media screen and (max-width: 768px) {
    width:251px;  
    height:220px;
    display:flex;
    justify-content: center;
    margin-top:114px;
  }
`;

const Img2 = styled.img`
  width:414px;
  height:352px;
  margin-left:40px;
  margin-top:20px;


  @media screen and (max-width: 768px) {
    width:251px;  
    height:220px;
    margin-left:35px;
    margin-top:80px;

   
  }
`;

const Img3 = styled.img`
  width:414px;
  height:352px;
  margin-left:-118px;
  margin-top:120px;


  @media screen and (max-width: 768px) {
    width:251px;  
    height:220px;
    margin-left:10px;
    margin-top:130px;

   
  }
`;


const Explain1 = styled.div`
 display: flex;
 justify-content: flex-start;
 align-items: center;
 margin-left:-20px;
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    margin-top:-60px;
  }
`;

const Explain22 = styled.div`
 width:80%;
 display: flex;
 justify-content:center;
 align-items: center;
 margin-top:-71px;
 margin-left:-180px;
 @media screen and (max-width: 768px) {
   display:none;
  }
`;

const MobileContainer = styled.div`
   width:80%;
   display: flex;
   justify-content:center;
   flex-direction: column;
   margin-top:-56px;
   margin-left:30px;

 @media screen and (min-width: 768px) {
   display:none;
  }
`;

const Explain3 = styled.div`
 margin-top: -50px;
 display: flex;
 align-items: center;
 justify-content:space-between;
 margin-left:90px;
 @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    margin-top:-90px;
    margin-left:0px;
  }
`;

const Text1 = styled.div`
  display: flex;
  flex-direction: column;
  margin-left:103px;
  margin-top:100px;
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content: center;
    margin-left:-20px;
    margin-top:38px;
  

  }
`;

const Text33 = styled.div`
  display: flex;
  flex-direction: column;
  margin-left:103px;
  margin-top:160px;
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content: center;
    margin-left:-20px;
    margin-top:134px;
  

  }
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  margin-left:103px;
  margin-top:100px;
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content: center;
    margin-left:-20px;

  

  }
`;

const Text2 = styled.div`
  display: flex;
  margin-left:103px;
  margin-top:140px;
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content: center;
    margin-left:-20px;
  

  }
`;


const Background1 = styled.div`
  background: #FFD900;
  border-radius: 28px;
  height:56px;
  display:flex;
  text-align:center;
  justify-content:center;
  width:55%;
;
  @media screen and (max-width: 768px) {
    width:208px;
    height:44px;
    margin-left:70px;
    margin-top:-6px;
}
`;
const Background2 = styled.div`
  background: #FFD900;
  border-radius: 28px;
  height:56px;
  text-align:center;
  display:flex;
  justify-content:center;
  width:50%;
  @media screen and (max-width: 768px) {
    width:208px;
    height:44px;
    margin-left:70px;
    margin-top:-68px;
  }
`;
const Background3 = styled.div`
  background: #FFD900;
  border-radius: 28px;
  height:56px;
  text-align:center;
  display:flex;
  justify-content:center;
  width:60%;
  @media screen and (max-width: 768px) {
    width:208px;
    height:44px;
    margin-left:70px;
    margin-top:-102px;
  }
`;

const SpanDot = styled.div`
  color: #CFD2D3;
  margin-top:-15px;
  width: 28px;
  height: 28px;
  font-family: 'Noto Sans TC';
  font-Weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.6px;
  
 @media screen and (max-width: 768px) {
   margin-top:-18px;
  }
`;

const SpanDot2 = styled.div`
  color: #CFD2D3;
  margin-top:4px;
  width: 36px;
  height: 36px;
 @media screen and (max-width: 768px) {
   margin-top:4px;
  }
`;

const DotContainer = styled.div`
 display:flex;
  @media screen and (max-width: 768px) {
 
  }
`;
const TextArea = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  margin-top:-16px;

  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    }
`;

const TextArea2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
   line-height: 4px;
  text-align: justify;
  letter-spacing: 0.03em;
  color: #1A1A1A;

  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 0px;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    }
`;


const AlignText = styled.div`
  margin-left:-40px;
  margin-top:35px;
  @media screen and (max-width: 768px) {
    margin-left:0px;
    margin-top:20px
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
          <Text1>
            <Background1>
              <ContantTitle>班別課程豐富客製化</ContantTitle>
            </Background1>
            <ContantText>
              <DotContainer>
                <SpanDot>・</SpanDot> <TextArea>個人班 / 團體班 / 選手班 /親子 / 包班</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot><TextArea>幼兒 / 兒童 / 國高中 / 大學/ 成人 / 銀髮</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot><TextArea>小班客製化教學 / 大班休閒娛樂教學髮</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> <TextArea>冬令營 / 夏令營 / 多元冬夏令營</TextArea>
              </DotContainer>
            </ContantText>
          </Text1>
        </Explain1>

        <Explain22>
          <Text2>

            <AlignText>
              <Background2>
                <ContantTitle>
                  寓教於樂多元發展
                </ContantTitle>
              </Background2>

              <ContantText>
                <DotContainer>
                  <SpanDot>・</SpanDot>
                  <TextArea>暖身做操 & 趣味體適能桌球</TextArea>
                </DotContainer>

                <DotContainer>
                  <SpanDot>・</SpanDot>
                  <TextArea>互動遊戲式球感</TextArea>
                </DotContainer>

                <DotContainer>
                  <SpanDot>・</SpanDot>
                  <TextArea>對打練習</TextArea>
                </DotContainer>

                <DotContainer>
                  <SpanDot>・</SpanDot>
                  <TextArea>互動單球調整揮拍動作</TextArea>
                </DotContainer>

                <DotContainer>
                  <SpanDot>・</SpanDot>
                  <TextArea>遊戲競賽</TextArea>
                </DotContainer>

                <DotContainer>
                  <SpanDot>・</SpanDot>
                  <TextArea>學習到球技 / 學習態度 / 品性 / 運動家精神 / 獲得體悟</TextArea>
                </DotContainer>
              </ContantText>
            </AlignText>
            <Img2 src={img2} alt="" />
          </Text2>

        </Explain22>

        <MobileContainer>
          <Img2 src={img2} alt="" />
          <Text>
            <Background2>
              <ContantTitle>
                寓教於樂多元發展
              </ContantTitle>
            </Background2>

            <ContantText>

              <DotContainer>
                <SpanDot>・</SpanDot>
                <TextArea>暖身做操 & 趣味體適能桌球</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot>
                <TextArea>互動遊戲式球感</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot>
                <TextArea>對打練習</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot>
                <TextArea>互動單球調整揮拍動作</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot>
                <TextArea>遊戲競賽</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot2>・</SpanDot2>
                <TextArea2>
                  學習到球技 / 學習態度 / 品性 /運動家精神 /  獲得體悟
                </TextArea2>
              </DotContainer>
            </ContantText>
          </Text>

        </MobileContainer>

        <Explain3>
          <Img3 src={img3} alt="" />
          <Text33>
            <Background3>
              <ContantTitle>伴你一生的全年齡運動</ContantTitle>
            </Background3>

            <ContantText>
              <DotContainer>
                < SpanDot>・</SpanDot> <TextArea>培養專注力 / 耐挫力 / 肌耐力 / 體能</TextArea><br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> <TextArea>肢體協調 / 遠離 3C</TextArea><br />
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> <TextArea>兒童腦部發育 / 成人腦部健全發展</TextArea><br />
              </DotContainer>
              <DotContainer>
                <SpanDot>・</SpanDot> <TextArea>培養良好運動習慣與社交能力</TextArea><br />
              </DotContainer>
              <DotContainer>
                <SpanDot>・</SpanDot> <TextArea>預防老人智力退化</TextArea>
              </DotContainer>
            </ContantText>
          </Text33>
        </Explain3>
      </Contant>
    </Container>
  </PageContainer>;
};

export default Classes;
