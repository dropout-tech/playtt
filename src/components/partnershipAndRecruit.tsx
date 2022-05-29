import React from "react";
import styled from "styled-components";
import colorLine from "../assets/partnershipAndRecruit/colorLine.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  margin:0px;
  @media screen and (max-width: 768px) {
    margin-left:0px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
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
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  line-Height:52px;
  margin-top:8px;
  @media screen and (max-width: 768px) {
    margin-left:0px;
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #CFD2D3;
    margin-top:0px;
  }
`;

const Container = styled.div`
  width: 100%;
  height:100%;

  @media screen and (max-width: 768px) {
    margin-top:-80px;
    padding-left:24px;
    padding-right:24px;
  }
`;

const TitleContainer = styled.div`
  margin-top:80px;
  @media screen and (min-width: 768px) {
    width:100%;
  }
`;

const BlueArea = styled.div`
  width: 100%;
  height:100%;
  background: #005CB9;  
  z-index:1;
  padding-bottom:90px;
  margin-top:60px;
 
  @media screen and (max-width: 768px) {
    width:100%;
    height:100%;
    margin-top:60px;
  
  }
`;

const ColorLineImg = styled.img`
  width: 98px;
  height: 27px;

  margin-top:50px;
   @media screen and (max-width: 768px) {
     margin-left:10px;
     margin-top:10px;
     width: 75px;
     height: 27px;
  }
`;


const GrayArea = styled.div`
  z-index:10;
  background: #F5F6F6;
  width: 270px;
  height:150px;
  display:flex;
  justify-content:center;
  align-items: center;
  

   @media screen and (max-width: 768px) {
    width: 116px;
    height:256px;
    display:flex;
    justify-content:center;
    flex-direction: column;
    margin-left:-12px;
  }
`;

const TextArea = styled.div`
 display:flex;
 justify-content:center;
 align-items: center;
 margin-right:40px;
 margin-top:-10px;
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    align-items: center;
    flex-direction: column;
    margin-left:12px;
  
    
  }
`;

const Text = styled.div`
  display:flex;
  margin-left:40px;
  margin-top:60px;
  flex-direction:column;
   @media screen and (max-width: 768px) {
    display:flex;
    flex-direction:row;
    margin-top:20px;

  
  }

`;

const BigTitle = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 30px;
  line-height: 44px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #FFFFFF;
  padding-top:70px;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 0.03em;
    color: #FFFFFF;
    transform: matrix(1, 0, 0, 1, 0, 0);
    margin-left:30px;
    padding-top:54px;
  }
`;

const TopText = styled.p`
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
  margin-top:12px;
   @media screen and (max-width: 768px) {
    width:110px;
    display: flex;
    align-items: center;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-left:40px;
    margin-top:8px;
  }
`;

const WhiteArea = styled.div`
  background: #FFFFFF;
  width: 270px;
  height: 333px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 768px) {
    width: 211px;
    height: 256px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

`;


// const TextkeyIn1 = styled.p`
//   font-family: 'Noto Sans TC';
//   font-style: normal;
//   font-weight: 500;
//   font-size: 18px;
//   line-height: 32px;
//   letter-spacing: 0.04em;
//   color: #1A1A1A;
//   display:flex;
//   justify-content:center;
//   align-items: center;

//   @media screen and (max-width: 768px) {
//     margin-left:50px;
//     font-family: 'Noto Sans TC';
//     font-style: normal;
//     font-weight: 500;
//     font-size: 16px;
//     line-height: 32px;
//     display: flex;
//     align-items: center;
//     text-align: center;
//     letter-spacing: 0.04em;
//     color: #1A1A1A;
//     margin-left:5px;


//   }
// `;

const TextkeyIn2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  text-align: center;
  flex-direction:column;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  @media screen and (max-width: 768px) {
    margin-left:70px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-left:5px;
  }
`;

const TextkeyIn3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  flex-direction:column;



  @media screen and (max-width: 768px) {
    margin-left:50px;
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-left:5px;
  }
`;

const TextkeyIn4 = styled.div`
  width: 210px;
  height:224px;
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-left:5px;
  }
`;

const Textcontainer = styled.div`
  margin-top:-20px;
  display: flex;
  justify-content:center;
  align-items: center;
  flex-direction: column;
 

`;

const Span = styled.span`
  font-family: 'Futura';
  font-weight:500;
  font-size:18px;
  line-height:32px;
  letter-spacing:4%;

`;

const Sapn2 = styled.span`
 font-family: 'Futura';
 font-weight: 700;
 font-size: 30px;
 line-height: 44px;
 letter-spacing: 0.04em;
  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-weight: 700;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 3%;
  }
`;

/* desktop thw newest info style end */
const PartnershipAndRecruit = () => {
  return <PageContainer>
    <Container>
      <TitleContainer>
        <Title1>合作與招募</Title1>
        <Title2>Partnership & Recruit</Title2>
      </TitleContainer>

      <BlueArea>
        <BigTitle> 目前已超過<Sapn2> 30 </Sapn2>個合作機構<br />
          企業機構、法人團體熱烈招募合作中！
        </BigTitle>
        <TextArea>
          <Text>
            <GrayArea>
              <Textcontainer>
                <ColorLineImg src={colorLine} alt="" />
                <TopText>運動場館</TopText>
              </Textcontainer>
            </GrayArea>
            <WhiteArea>
              <TextkeyIn2>
                <p style={{ margin: 0 }}>舞動陽光</p>
                <p style={{ margin: 0 }}>華江俱樂部</p>
                <p style={{ margin: 0 }}>三峽運動中心</p>
                <p style={{ margin: 0 }}>中正運動中心</p>
                <p style={{ margin: 0 }}>等 ⋯⋯</p>
              </TextkeyIn2>
            </WhiteArea>

          </Text>

          <Text>
            <GrayArea>
              <Textcontainer>
                <ColorLineImg src={colorLine} alt="" />
                <TopText>學校社團</TopText>
              </Textcontainer>
            </GrayArea>
            <WhiteArea>
              <TextkeyIn2>
                <p style={{ margin: 0 }}>大龍國小</p>
                <p style={{ margin: 0 }}>懷生國小</p>
                <p style={{ margin: 0 }}>等 ⋯⋯</p>
              </TextkeyIn2>
            </WhiteArea>
          </Text>

          <Text>
            <GrayArea>
              <Textcontainer>
                <ColorLineImg src={colorLine} alt="" />
                <TopText>教育機構</TopText>
              </Textcontainer>
            </GrayArea>
            <WhiteArea>
              <TextkeyIn3>
                <p style={{ margin: 0 }}>何嘉仁幼兒園</p>
                <p style={{ margin: 0 }}>維多利亞</p>
                <p style={{ margin: 0 }}>喬鈴補習班</p>
                <p style={{ margin: 0 }}>等 ⋯⋯</p>
              </TextkeyIn3>
            </WhiteArea>
          </Text>

          <Text>
            <GrayArea>
              <Textcontainer>
                <ColorLineImg src={colorLine} alt="" />
                <TopText>桌球場館</TopText>
              </Textcontainer>
            </GrayArea>
            <WhiteArea>
              <TextkeyIn4>
                <p style={{ margin: 0 }}><Span>Let's Play </Span>蘆洲店</p>
                <p style={{ margin: 0 }}><Span>Let's Play </Span>東門店</p>
                <p style={{ margin: 0 }}><Span>Let's Play </Span>善導寺店</p>
                <p style={{ margin: 0 }}><Span>Let's Play </Span>新莊店</p>
                <p style={{ margin: 0 }}><Span>Let's Play Onward TT </Span>乒乓吧 <Span>X Let's Play </Span>  乒運動桌球館</p>
              </TextkeyIn4>

            </WhiteArea>
          </Text>
        </TextArea>
      </BlueArea>

    </Container>

  </PageContainer>;
};

export default PartnershipAndRecruit;
