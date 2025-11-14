import React from "react";
import styled from "styled-components";
import { PageContainer, Container, SectionTitle, SectionSubtitle, TitleGroup } from "../styles/components";
import { theme, media } from "../styles/theme";
import img1 from "../assets/classes/img1.png";
import img2 from "../assets/classes/img2.png";
import img3 from "../assets/classes/img3.png";

const ClassesContainer = styled(Container)`
  ${media.tablet} {
    margin-top: -80px;
    margin-left: 0px;
    margin-bottom: 20px;
  }
`;

const ClassIntroduce = styled(TitleGroup)`
  margin-top: 30px;
  
  ${media.tablet} {
    margin-left: 0px;
    margin-top: 30px;
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
    margin-top:18px;
  }
`;

const ContantText = styled.div`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.03em;
  color: #1A1A1A;
  width:550px;
  margin-top:36px;


  @media screen and (max-width: 768px) {
    width: auto;
    display:flex;
    flex-direction: column;
    justify-content:center;
    align-items: center;
    line-height: 22px;
    padding-left:24px;
    padding-right:24px;
  

  }
`;

const ContantText2 = styled.p`
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
    width: auto;
    display:flex;
    flex-direction: column;
    align-items: center;
    justify-content:center;
    line-height: 22px;
    margin-top:36px;
  }
`;

const Contant = styled.div`
  width:auto;
  height:100%;
  display:flex;
  flex-direction: column;
  align-items: center; 
  margin-top:4px;
 
  @media screen and (max-width: 768px) {
     margin-top:0px;
  
    
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
    align-items: center;
    margin-top:14px;
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
    display:flex;
    justify-content: center;
    align-items: center;
    margin-left:0px;


   
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
    margin-top:74px;
    margin-left:0px;
   
  }
`;


const Explain1 = styled.div`
 display: flex;
 justify-content: center;
 align-items: center;

  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top:0px;
  }
`;

const Explain22 = styled.div`
 width:80%;
 display: flex;
 justify-content:center;
 align-items: center;
 margin-top:-71px;
 
 @media screen and (max-width: 768px) {
   display:none;
  }
`;

const MobileContainer = styled.div`
   display: flex;
   justify-content:center;
   align-items: center;
   flex-direction: column;
   margin-top:24px;
   padding-left:24px;
   padding-right:24px;

 @media screen and (min-width: 768px) {
   display:none;
  }
`;

const Explain3 = styled.div`
 margin-top: -50px;
 display: flex;
 align-items: center;
 justify-content:center;
 margin-left:118px;
 @media screen and (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content:center;
    flex-direction: column;
    /* margin-top:-106px; */
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
    align-items: center;
    margin-left:0px;
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
    align-items: center;
    margin-left:0px;
    margin-top:38px;
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
    align-items: center;
    margin-left:0px;

  

  }
`;

const Text2 = styled.div`
  display: flex;
  margin-left:103px;
  margin-top:140px;
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content: center;
    
    margin-left:0px;
  

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
    margin-top:-6px;
    margin-left:0px;
    align-items: center;
}
`;
const Background2 = styled.div`
   background: #FFD900;
   border-radius: 28px;
   height:56px;
   display:flex;
   justify-content:center;
   text-align:center;
   width:50%;
  @media screen and (max-width: 768px) {
    width:190px;
    height:44px;
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
    margin-left:0px;
    display:flex;
    justify-content:center;
    align-items: center;
    padding-left:10px;
    padding-right:10px;
    margin-top:-6px;
  
  }
`;

const SpanDot = styled.span`
  color: #CFD2D3;
  margin-top:-15px;
  width: 20px;
  height: 32px;
  font-family: 'Noto Sans TC';
  font-Weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.6px;
  
 @media screen and (max-width: 768px) {
    margin-top:-16px;
    font-family: 'Noto Sans TC';
    font-Weight: 500;
    font-size: 16px;
    line-height: 32px;
    letter-spacing: 4%;
    display: flex;
    text-align:left;
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
    letter-spacing: 0.04em;
    color: #1A1A1A;
    text-align:center;
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
    line-height: 32px;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-top:-16px;
    }
`;


const AlignText = styled.div`
  margin-left:-40px;
  margin-top:35px;
  @media screen and (max-width: 768px) {
    margin-left:0px;
    margin-top:20px;
    display:flex;
    justify-content:center;
    align-items:center;
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
    line-height:32px;
    letter-spacing:4%;
    }
`;


/* desktop thw newest info style end */
const Classes = () => {
  return <PageContainer id="classes">
    <ClassesContainer>

      <ClassIntroduce>
        <SectionTitle>課程介紹</SectionTitle>
        <SectionSubtitle>Our Course</SectionSubtitle>
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
                <SpanDot>・</SpanDot> <TextArea>個人班 / 團體班 / 選手班 / 親子 / 包班</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot><TextArea>幼兒 / 兒童 / 國高中 / 大學 / 成人 / 銀髮</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot><TextArea>小班客製化教學 / 大班休閒娛樂教學</TextArea>
              </DotContainer>

              <DotContainer>
                <SpanDot>・</SpanDot> <TextArea>冬令營 / 夏令營(搭配多元才藝合作)</TextArea>
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
                  <TextArea>暖身做操<Span> & </Span>趣味體適能桌球</TextArea>
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
                  <TextArea>球技 / 學習態度 / 品性 / 運動家精神 / 獲得體悟</TextArea>
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

            <ContantText2>

              <DotContainer>
                <SpanDot>・</SpanDot>
                <TextArea>暖身做操<Span> & </Span>趣味體適能桌球</TextArea>
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
                <TextArea2>
                  球技 / 學習態度 / 品性 / 運動家精神 / 獲得體悟
                </TextArea2>
              </DotContainer>
            </ContantText2>
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
                <SpanDot>・</SpanDot> <TextArea>肢體協調 / 遠離 <Span>3C</Span></TextArea><br />
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
    </ClassesContainer>
  </PageContainer>;
};

export default Classes;
