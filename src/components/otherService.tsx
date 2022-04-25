import React from "react";
import styled from "styled-components";
import img1 from "../assets/otherService/img1.png";
import img2 from "../assets/otherService/img2.png";
import img3 from "../assets/otherService/img3.png";
import img4 from "../assets/otherService/img4.png";
import img5 from "../assets/otherService/img5.png";
import img6 from "../assets/otherService/img6.png";


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
 padding-top:80px;
 padding-bottom: 80px;
  @media screen and (max-width: 768px) {
    display:none;
  }
`;

const BelowArea = styled.div`
 display: flex;
 justify-content:center;
 margin-top:30px; 
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
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
    @media screen and (max-width: 768px) {
    
  }
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
  letter-spacing: 0.04em;
  color: #1A1A1A;
    @media screen and (max-width: 768px) {
    
  }
`;

const TopArea = styled.div`
 display: flex;
 justify-content:center;
 margin-top:60px;
   @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

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
    @media screen and (max-width: 768px) {
    
  }
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
    @media screen and (max-width: 768px) {
     margin-top:30px;
  }
`;

const Img1 = styled.img`
  width: 71px;
  height:92px;
  margin-right:30px;
  margin-top:30px;
    @media screen and (max-width: 768px) {
    
  }
`;

const Img2 = styled.img`
  width: 84px;
  height:84px;
  margin-right:30px;
  margin-top:30px;
    @media screen and (max-width: 768px) {
    
  }
`;

const Img3 = styled.img`
  width: 100px;
  height:100px;
  margin-right:30px;
  margin-top:50px;
    @media screen and (max-width: 768px) {
    
  }
`;

const Img4 = styled.img`
  width: 84px;
  height:94px;
  margin-right:30px;
  margin-top:20px;
    @media screen and (max-width: 768px) {
    
  }
`;

const Img5 = styled.img`
  width: 84px;
  height:84px;
  margin-right:30px;
  margin-top:30px;
    @media screen and (max-width: 768px) {
    
  }
`;

const Img6 = styled.img`
  width: 92px;
  height:92px;
  margin-right:30px;
  margin-top:-30px;
    @media screen and (max-width: 768px) {
    
  }
`;

const ImgContainer = styled.div`
  display: flex;
  justify-content:flex-end;
    @media screen and (max-width: 768px) {
    
  }
`;

const MobileContainer = styled.div`
  @media screen and (max-width: 768px) {
    padding-top:80px;
    padding-bottom: 80px;
    
    }
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
          <ImgContainer>
            <Img1 src={img1} alt="" />
          </ImgContainer>
        </TextContainer>

        <TextContainer>
          <Title3>場地租借</Title3>
          <Text>
            平日上午包場優惠<br />
            歡迎洽談，提早預約<br />
            平日 14:00–21:00 與周末租桌服務
          </Text>
          <ImgContainer>
            <Img2 src={img2} alt="" />
          </ImgContainer>
        </TextContainer>

        <TextContainer>
          <Title3>球具販售</Title3>
          <Text>
            依據需求協助搭配和製作球具，<br />
            以達到學習和運動成效為主要目的。
          </Text>
          <ImgContainer>
            <Img3 src={img3} alt="" />
          </ImgContainer>
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
          <ImgContainer>
            <Img4 src={img4} alt="" />
          </ImgContainer>
        </TextContainer>

        <TextContainer>
          <Title3>趣味活動</Title3>
          <Text>
            桌球結合趣味競賽<br />
            各式行銷活動協辦<br />
            自媒體 / 媒體合作
          </Text>
          <ImgContainer>
            <Img5 src={img5} alt="" />
          </ImgContainer>
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
          <ImgContainer>
            <Img6 src={img6} alt="" />
          </ImgContainer>
        </TextContainer>

      </BelowArea>







    </Container>

    <MobileContainer>
      <div>
        <Title1>其他服務</Title1>
        <Title2>Other Service</Title2>
      </div>

      <TextContainer>
        <Title3>桌球俱樂部</Title3>
        <Text>
          合作機構：華江高中<br />
          聚集桌球愛好打手<br />
          舉辦活動分享知識增加凝聚力
        </Text>
        <ImgContainer>
          <Img1 src={img1} alt="" />
        </ImgContainer>
      </TextContainer>

      <TextContainer>
        <Title3>場地租借</Title3>
        <Text>
          平日上午包場優惠<br />
          歡迎洽談，提早預約<br />
          平日 14:00–21:00 與周末租桌服務
        </Text>
        <ImgContainer>
          <Img2 src={img2} alt="" />
        </ImgContainer>
      </TextContainer>

      <TextContainer>
        <Title3>球具販售</Title3>
        <Text>
          依據需求協助搭配和製作球具，<br />
          以達到學習和運動成效為主要目的。
        </Text>
        <ImgContainer>
          <Img3 src={img3} alt="" />
        </ImgContainer>
      </TextContainer>


      <TextContainer>
        <Title3>場館加盟與聯盟合作</Title3>
        <Text>
          提供系統化的 SOP 協助桌球產業發<br />
          展更全面，並且共享產業資源互利，<br />
          提供有心推廣桌球的同業更好的機會。<br />
        </Text>
        <ImgContainer>
          <Img4 src={img4} alt="" />
        </ImgContainer>
      </TextContainer>

      <TextContainer>
        <Title3>趣味活動</Title3>
        <Text>
          桌球結合趣味競賽<br />
          各式行銷活動協辦<br />
          自媒體 / 媒體合作
        </Text>
        <ImgContainer>
          <Img5 src={img5} alt="" />
        </ImgContainer>
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
        <ImgContainer>
          <Img6 src={img6} alt="" />
        </ImgContainer>
      </TextContainer>








    </MobileContainer>
  </PageContainer>;
};

export default OtherService;
