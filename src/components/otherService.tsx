import React from "react";
import styled from "styled-components";
import banner from "../assets/homepage/banner.png";


// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`


`;

const BelowArea = styled.div`
 display: flex;
 justify-content:center;
 margin-top:30px; 
`;

const Title1 = styled.p`
  margin-top:50px;
  display: flex;
  justify-content:center;
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
  display: flex;
  justify-content:center;
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:-25px;
`;

const Title3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;

const TopArea = styled.div`
 display: flex;
 justify-content:center;
 margin-top:60px;

`;

const Text = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  text-align: justify;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;


const TextContainer = styled.div`
  display:flex;
  flex-direction:column;
  background: rgba(207, 210, 211,0.2);
  width: 373px;
  height:373px;
  margin-left:30px;
  padding-left:40px;
  padding-top:10px;
`;

/* desktop thw newest info style end */
const OtherService = () => {
  return <PageContainer>
    <Container>
      <div>
        <Title1>其他服務</Title1>
        <Title2>Other Service</Title2>
      </div>

      <TopArea>
        <TextContainer>
          <Title3>桌球俱樂部</Title3>
          <Text>
            合作機構：華江高中<br />
            聚集桌球愛好打手<br />
            舉辦活動分享知識增加凝聚力
          </Text>

          <img src="" alt="" />

        </TextContainer>



        <TextContainer>
          <Title3>場地租借</Title3>
          <Text>
            平日上午包場優惠<br />
            歡迎洽談，提早預約<br />
            平日 14:00–21:00 與周末租桌服務
          </Text>
          <img src="" alt="" />

        </TextContainer>



        <TextContainer>
          <Title3>球具販售</Title3>
          <Text>
            依據需求協助搭配和製作球具，<br />
            以達到學習和運動成效為主要目的。
          </Text>
          <img src="" alt="" />

        </TextContainer>

      </TopArea>

      <BelowArea>
        <TextContainer>
          <Title3>場館加盟與聯盟合作</Title3>
          <Text>
            提供系統化的 SOP 協助桌球產業發<br />
            展更全面，並且共享產業資源互利，<br />
            提供有心推廣桌球的同業更好的機會。<br />
          </Text>

          <img src="" alt="" />

        </TextContainer>



        <TextContainer>
          <Title3>趣味活動</Title3>
          <Text>
            桌球結合趣味競賽<br />
            各式行銷活動協辦<br />
            自媒體 / 媒體合作
          </Text>
          <img src="" alt="" />

        </TextContainer>



        <TextContainer>
          <Title3>VIP 專區</Title3>
          <Text>
            特別精心打造的桌球 VIP 包廂空間，<br />
            讓玩樂和歡笑回憶留在美好的空間，<br />
            更方便拍照留念。目標成為雙北桌球<br />
            跨足休閒娛樂的業界首選，<br />
            開創桌球產業藍海。
          </Text>
          <img src="" alt="" />

        </TextContainer>

      </BelowArea>







    </Container>
  </PageContainer>;
};

export default OtherService;
