import React from "react";
import styled from "styled-components";
import group from "../assets/letsPlayStar/group.png";
import group2 from "../assets/letsPlayStar/group2.png";
import img1 from "../assets/letsPlayStar/img1.png";
import img2 from "../assets/letsPlayStar/img2.png";
import img3 from "../assets/letsPlayStar/img3.png";


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

 padding-bottom: 80px;
  @media screen and (max-width: 768px) {
    margin-top:-70px;
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
  display: flex;
  justify-content:center;
   @media screen and (max-width: 768px) {
    
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
  display: flex;
  justify-content:center;
  margin-top:-30px;
  line-Height:52px;
  @media screen and (max-width: 768px) {
    
  }
`;
const Title3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-left:40px;

   @media screen and (max-width: 768px) {
    margin-top:20px;
    margin-right:10px;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
  }
`;
const Title5 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-left:30px;
  margin-top:50px;
   @media screen and (max-width: 768px) {
    margin-right:10px;
    margin-top:-20px;
    margin-right:10px;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
 
  }
`;

const Title4 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-left:40px;

   @media screen and (max-width: 768px) {
    margin-top:20px;
    margin-right:10px;
    margin-top:20px;
    margin-right:10px;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;
  }
`;

const GroupImg = styled.img`
  width:100%;
  height:100%;
   @media screen and (max-width: 768px) {
    
  }
`;

const Background = styled.div`
  background: #FFD900;
  width:150%;
  padding-bottom:30px;
  display:flex;
  justify-content: center;
  align-items: center;


 @media screen and (max-width: 768px) {
    margin-top:145px;
    width:100%;
  }
`;

const Img1 = styled.img`
  width:144px;
  height:126px;
  margin-left:20px;
   @media screen and (max-width: 768px) {
  
  }
`;

const Img2 = styled.img`
  width:144px;
  height:126px;
  margin-left:-60px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Img3 = styled.img`
  width:66px;
  height:52px;
  margin-left:20px;
   @media screen and (max-width: 768px) {
    
  }

`;

const Img4 = styled.img`
  width:66px;
  height:52px;
  margin-left:20px;
   @media screen and (max-width: 768px) {
    
  }

`;
const LeftArea = styled.div`
   display:flex;
   justify-content:center;
   align-items: center;
   margin-top:30px;
    
   @media screen and (max-width: 768px) {
    display:flex;
    align-items:center;
    flex-direction: column;
      margin-top:30px;
    
  }
`;

const TextContainer = styled.div`
 display:flex;
 justify-content:center;
 margin-top:-160px;
 width:80%;
  @media screen and (max-width: 768px) {
    display:flex;
    align-items: center;
    justify-content:center;
    flex-direction: column;
    margin-left:0px;
    width:100%;
  }
`;

const GrayArea = styled.div`
  background: #F5F6F6;
  width:150%;
  display: flex;
  justify-content:center;
  align-items:center;
 
   @media screen and (max-width: 768px) {
  width:100%;
  }
  
`;

const Span = styled.span`
 color: #FF40B4;
 font-family: 'Noto Sans TC';
 font-weight: 500;
 font-size: 20px;
 line-height: 36px;
 letter-spacing: 0.6px;
  @media screen and (max-width: 768px) {
    
  }
`;

const GrayAreaText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 0.03em;
  color: #1A1A1A;
   @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
    align-items: center;
    margin-left:0px;
    
  }
`;

const Container2 = styled.div`
 display:flex;
 justify-content:center;
 align-items: center;
 flex-direction: column;
  @media screen and (max-width: 768px) {
    display: none;
      
    }

`;

const MobileContainer = styled.div`
   
  @media screen and (min-width: 768px) {
      display: none;
    }
`;


const Dot = styled.div`
  display:flex;
 @media screen and (min-width: 768px) {
      display: none;
    }
`;

const TextArea = styled.div`
  display:flex;
  justify-content:center;
  align-items: center;
  flex-direction: column;
  margin-top:15px;

`;

/* desktop thw newest info style end */
const LetsPlayStar = () => {
  return <PageContainer>
    <Container>
      <div>
        <Title1>藝人明星桌球隊</Title1>
        <Title2>Let's Play Star </Title2>
      </div>
      <Container2>
        <GroupImg src={group} alt="" />

        <TextContainer>
          <Background>
            <TextArea>
              <LeftArea>
                <Img1 src={img1} alt="" />
                <Img3 src={img3} alt="" />
                <Title3>推廣桌球<br />
                  提升全民桌球風氣</Title3>
              </LeftArea>

              <LeftArea>
                <Img2 src={img2} alt="" />
                <Img4 src={img3} alt="" />
                <Title4>公益桌球賽</Title4>
              </LeftArea>
            </TextArea>
          </Background>

          <GrayArea>
            <GrayAreaText>
              <Span>・</Span> 成立於 2020/12/15 <br />
              <Span>・</Span> 召集人 —— Hero 戴祖雄 & 阿寬教練 郭則寬<br />
              <Span>・</Span> 由專業教練團隊協助持續訓練<br />
              <Span>・</Span>  大幅提升桌技和認知<br />
              <Span>・</Span>  與贊助廠商合作營運<br />
              <Span>・</Span>  每週練習1-2次<br />
              <Span>・</Span> 與全明星運動會紅隊交流<br />
              <Span>・</Span>  明星交流賽與檢定
            </GrayAreaText>

          </GrayArea>
        </TextContainer>

      </Container2>


      <MobileContainer>
        <GroupImg src={group2} alt="" />

        <TextContainer>
          <Background>
            <LeftArea>
              <Img1 src={img1} alt="" />

              <Title3>推廣桌球</Title3>
              <Title5>提升全民桌球風氣</Title5>


            </LeftArea>

            <LeftArea>
              <Img1 src={img2} alt="" />

              <Title4>公益桌球賽</Title4>
            </LeftArea>
          </Background>
          <GrayArea>
            <GrayAreaText>
              <Dot>
                <Span>・</Span> 成立於 2020/12/15 <br />
              </Dot>

              <Dot>
                <Span>・</Span> 召集人 —— Hero 戴祖雄 & 阿<br />&emsp; &emsp; &ensp; 寬教練 郭則寬<br />
              </Dot>

              <Dot>
                <Span>・</Span> 由專業教練團隊協助持續訓練<br />
              </Dot>

              <Dot>
                <Span>・</Span>  大幅提升桌技和認知<br />
              </Dot>

              <Dot>
                <Span>・</Span>  與贊助廠商合作營運<br />
              </Dot>

              <Dot>
                <Span>・</Span>
                與全明星運動會紅隊交流<br />
              </Dot>

              <Dot>
                <Span>・</Span>  明星交流賽與檢定
              </Dot>
            </GrayAreaText>

          </GrayArea>
        </TextContainer>

      </MobileContainer>

    </Container>
  </PageContainer>;
};

export default LetsPlayStar;
