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

const Title1 = styled.p`
  margin-top:50px;
  display: flex;
  justify-content:center;
`;

const Title2 = styled.p`
  display: flex;
  justify-content:center;
`;

const Title3 = styled.p`
  
`;

const TopArea = styled.div`
 display: flex;
 justify-content:center;
 margin-top:80px;

`;

const Text = styled.p`

`;


const TextContainer = styled.div`
  display:flex;
  flex-direction:column;
  background: rgba(207, 210, 211,0.2);
  width: 373px;
  height:373px;
  margin-left:30px;
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






    </Container>
  </PageContainer>;
};

export default OtherService;
