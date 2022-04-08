import React from "react";
import styled from "styled-components";
import cho from "../assets/alliancePlan/cho.png";
import hha from "../assets/alliancePlan/hha.png";
import ho from "../assets/alliancePlan/ho.png";



// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
 margin-top:550px;
`;

const Title = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 34px;
  line-height: 49px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;

const TitleWord = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 34px;
  line-height: 45px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:-10px;
`;

const Background = styled.div`
  background: #CFD2D3;
  width:100%;
  height:100%;
  display:flex;

`;


const Circle1 = styled.div`
  width: 588px;
  height: 588px;
  left: 872px;
  top: 696px;
  background: #FFFFFF;
  border-radius:294px;
  margin-top:30px;
`;

const Circle2 = styled.div`
  display:flex;
  justify-content:center;
  z-index:1;
  width: 660px;
  height: 660px;
  left: 390px;
  top: 732px;
  background: #FFFFFF;
  border-radius:330px;
  margin-right:-50px;
`;

const Circle3 = styled.div`
  width: 588px;
  height: 588px;
  left: 872px;
  top: 696px;
  background: #FFFFFF;
  border-radius:294px;
  margin-top:30px;
`;


const Text = styled.div`
 z-index:10px;
`;

const Circle = styled.div`
 display:flex;
 align-items: center;
 margin-left:200px;


`;















/* desktop thw newest info style end */
const alliancePlan = () => {
  return <PageContainer>
    <Container>
      <Title>聯盟計畫</Title>
      <TitleWord>Alliance</TitleWord>
      <Background>
        <Circle>
          <Circle1>
            <Text>
              <img src="" alt="" />
              <p>創立初衷</p>
              <p>將既有的桌球經營 Know How 傳承與系統規劃，改善桌球產業發展，希望透過每位老闆力量，共同團結讓台灣桌球被更多人看見！</p>
            </Text>
          </Circle1>

          <Circle2>
            <Text>
              <img src="" alt="" />
              <p>計畫簡介</p>
              <p>Let's Play 立志打造跨界聯盟的創新桌球團隊，主軸為三大方向：跨產業合作 X 全齡複合空間 X 運動設計美學。希望共享資源讓台灣桌球產業互利合作，推廣讓全年齡的朋友們愛上桌球，一起體驗桌球的好處和快樂！</p>
            </Text>
          </Circle2>

          <Circle3>
            <Text>
              <img src="" alt="" />
              <p>聯盟分佈</p>
              <p>全台目前分店為 4 家，合作聯盟據點 10 個以上，聯盟球館</p>
              <p>陸續招募中！</p>
            </Text>
          </Circle3>
        </Circle>

      </Background>
    </Container>

  </PageContainer>;
};

export default alliancePlan;
