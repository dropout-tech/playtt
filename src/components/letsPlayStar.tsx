import React from "react";
import styled from "styled-components";
import group from "../assets/letsPlayStar/group.png";
import img1 from "../assets/letsPlayStar/img1.png";
import img2 from "../assets/letsPlayStar/img2.png";
import img3 from "../assets/letsPlayStar/img3.png";

// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`

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
  margin-left:30px;
  margin-top:50px;
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
  margin-left:30px;
  margin-top:50px;
`;

const GroupImg = styled.img`
  width:100%;
  height:100%;
`;

const Background = styled.div`
  background: #FFD900;
  width:50%;
  padding-bottom:30px;

`;

const Img1 = styled.img`
  width:144px;
  height:126px;
  margin-top:30px;
  margin-left:60px;
`;

const Img2 = styled.img`
  width:60px;
  height:62px;
  margin-top:60px;
  margin-left:40px;
`;

const LeftArea = styled.div`
  display:flex;
 

`;








/* desktop thw newest info style end */
const LetsPlayStar = () => {
  return <PageContainer>
    <Container>
      <div>
        <Title1>藝人明星桌球隊</Title1>
        <Title2>Let's Play Star </Title2>
      </div>

      <GroupImg src={group} alt="" />

      <div>
        <Background>
          <LeftArea>
            <Img1 src={img1} alt="" />
            <Img2 src={img3} alt="" />
            <Title3>推廣桌球
              提升全民桌球風氣</Title3>
          </LeftArea>

          <LeftArea>
            <Img1 src={img2} alt="" />
            <Img2 src={img3} alt="" />
            <Title4>公益桌球賽</Title4>
          </LeftArea>
        </Background>

        <div>
          <p>
            ・ 成立於 2020/12/15 <br />
            ・ 召集人 —— Hero 戴祖雄 & 阿寬教練 郭則寬<br />
            ・ 由專業教練團隊協助持續訓練<br />
            ・ 大幅提升桌技和認知<br />
            ・ 與贊助廠商合作營運<br />
            ・ 每周練習 1–2 次<br />
            ・ 與全明星運動會紅隊交流<br />
            ・ 明星交流賽與檢定
          </p>

        </div>
      </div>

    </Container>
  </PageContainer>;
};

export default LetsPlayStar;
