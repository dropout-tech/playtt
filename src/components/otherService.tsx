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
 margin-top:110px;
 padding-bottom: 80px;
 margin-left:-40px;
  @media screen and (max-width: 768px) {
  display:none;
  }
`;

const BelowArea = styled.div`
 display: flex;
 justify-content:center;
 align-items: center;
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
  text-align: center;
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 36px;
  line-height: 52px;
  letter-spacing: 0.04em;
  margin-left:30px;
  color: #1A1A1A;
    @media screen and (max-width: 768px) {
    margin-left:0px;
    font-size: 26px;
    line-height: 40px;
    display:flex;
    justify-content:center;
    align-items: center;
  }
`;

const Title2 = styled.p`
  display: flex;
  justify-content:center;
  text-align: center;
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:-30px;
  margin-bottom:60px;
  line-Height:52px;
  margin-left:20px;
    @media screen and (max-width: 768px) {
    margin-left:0px;
    margin-top:-26px;
    font-size: 26px;
    line-height: 40px;
    display:flex;
    justify-content:center;
    align-items: center;
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
  margin-top:32px;
    @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 0.03em;
    color: #1A1A1A;
    margin-top:0px;

  }
`;

const TitleNew = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-top:32px;
    @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 0.03em;
    color: #1A1A1A;
    margin-top:0px;

  }
`;


const TopArea = styled.div`
 display: flex;
 justify-content:center;
 margin-top:-10px;
   @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

`;

const Text = styled.div`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  text-align: justify;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-top:-10px;
  display:flex;
  flex-direction:column;
    @media screen and (max-width: 768px) {
      font-family: 'Noto Sans TC';
      font-style: normal;
      font-weight: 500;
      font-size: 16px;
      line-height: 30px;
      text-align: justify;
      letter-spacing: 0.02em;
      color: #1A1A1A;
      padding-right:24px;
      margin-top:-4px;
  }
`;

const TextContainer = styled.div`
  display:flex;
  flex-direction:column;
  justify-content:center;
  background: rgba(207, 210, 211,0.2);
  width: 373px;
  height:373px;
  margin-left:40px;
  margin-top:10px;
  padding-top:10px;
    @media screen and (max-width: 768px) {
     margin-left:0px;
     margin-top:20px;
     padding-top:0px;
     height:327px;
     padding-left:24px;
     padding-right:24px;
    
  }
`;

const TextContainer2 = styled.div`
  display:flex;
  flex-direction:column;
  justify-content:center;
  background: rgba(207, 210, 211,0.2);
  width: 373px;
  height:373px;
  margin-left:40px;
  margin-top:10px;
  padding-top:10px;
    @media screen and (max-width: 768px) {
     margin-left:0px;
     margin-top:20px;
     padding-top:0px;
     height:327px;
     padding-left:24px;
     padding-right:24px;
    
  }
`;

const Img1 = styled.img`
  width: 148px;
  height:148px;
  margin-right:0px;
  margin-top:14px;
   
  
  
`;

const Img2 = styled.img`
  width: 148px;
  height:148px;
  margin-right:0px;
  margin-top:14px;
   
  
`;

const Img3 = styled.img`
  width: 148px;
  height:148px;
  margin-right:0px;
  margin-top:40px;
   
  
`;

const Img4 = styled.img`
  width: 148px;
  height:148px;
  margin-right:0px;
  margin-top:-30px;
   
  
`;

const Img5 = styled.img`
  width: 148px;
  height:148px;
  margin-right:0px;
  margin-top:-35px;
   
  
`;

const Img6 = styled.img`
  width: 148px;
  height:148px;
  margin-right:0px;
  margin-top:-70px;
 
  
`;

const MobileImg = styled.img`
  width: 148px;
  height:148px;
  margin-right:0px;
  margin-top:-70px;
    @media screen and (max-width: 768px) {
    width: 120px;
    height:120px;
    display:flex;
    justify-content:flex-end;
    align-items: flex-end;
    margin-top:0px;
  }
`;

const ImgContainer = styled.div`
  display: flex;
  justify-content:flex-end;
  margin-top:20px;
 
    @media screen and (max-width: 768px) {
     align-items:flex-end;
     margin-top:0px;
  }
`;

const MobileContainer = styled.div`
  display:none;
  @media screen and (max-width: 768px) {
    padding-top:30px;
    display:flex;
    flex-direction:column;
    padding-left:24px;
    padding-right:24px;
    }
`;



const TextSize = styled.div`
  width:309px;
  height:100%;
  margin-left:32px;
  @media screen and (max-width: 768px) {
    display:none;
    }

`;



const TextText = styled.p`
  @media screen and (max-width: 768px) {
   margin:0px;
    }

`;

const Span2 = styled.span`
  font-family: 'Futura';
  font-weight: 700;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em ;
`;

const Span3 = styled.span`
  font-family: 'Futura';
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.04em;

`;

const Title = styled.div`

`;

const TextArea = styled.div`
 @media screen and (max-width: 768px) {
  margin-top:20px;
  }
  

`;

const TextArea2 = styled.div`
  height: 300px ;
  background: rgba(207, 210, 211, 0.2);
  @media screen and (max-width: 768px) {
   height: 100% ;
   padding-top:24px;
   padding-left:24px;
   display:flex;
   flex-direction: column;
   justify-content:space-between;
  }
`;

const TopContainer = styled.div`
  @media screen and (max-width: 768px) {
   margin-bottom:-40px;
  }

`;

/* desktop thw newest info style end */
const OtherService = () => {
  return <PageContainer>
    <Container>
      <Title>
        <Title1>其他服務</Title1>
        <Title2>Other Service</Title2>
      </Title>

      <TopArea>
        <TextContainer>
          <TextSize>
            <Title3>桌球俱樂部</Title3>
            <Text>
              合作機構：華江高中
              聚集桌球愛好打手
              舉辦活動分享知識增加凝聚力
            </Text>
          </TextSize>
          <ImgContainer>
            <Img1 src={img1} alt="" />
          </ImgContainer>
        </TextContainer>

        <TextContainer>
          <TextSize>
            <Title3>場地租借</Title3>
            <Text>
              <p style={{margin:0}}>
                平日上午包場優惠
                歡迎洽談，提早預約平日<Span3> 14:00–21:00 </Span3> 與周末租桌服務
              </p>      
            </Text>
          </TextSize>
          <ImgContainer>
            <Img2 src={img2} alt="" />
          </ImgContainer>
        </TextContainer>

        <TextContainer>
          <TextSize>
            <Title3>球具販售</Title3>
            <Text>
              依據需求協助搭配和製作球具，
              以達到學習和運動成效為主要目的。
            </Text>
          </TextSize>
          <ImgContainer>
            <Img3 src={img3} alt="" />
          </ImgContainer>
        </TextContainer>

      </TopArea>

      <BelowArea>
        <TextContainer>
          <TextSize>
            <Title3>場館加盟與聯盟合作</Title3>
            <Text>
              <p style={{margin:0}}>
                提供系統化的 <Span3> SOP </Span3> 協助桌球產業發
                展更全面，並且共享產業資源互利，
                提供有心推廣桌球的同業更好的機會。
              </p>
              
            </Text>
          </TextSize>
          <ImgContainer>
            <Img4 src={img4} alt="" />
          </ImgContainer>
        </TextContainer>

        <TextContainer>
          <TextSize>
            <Title3>趣味活動</Title3>
            <Text>
              桌球結合趣味競賽
              各式行銷活動協辦
              自媒體 / 媒體合作
            </Text>
          </TextSize>
          <ImgContainer>
            <Img5 src={img5} alt="" />
          </ImgContainer>
        </TextContainer>

        <TextContainer>
          <TextSize>
            <Title3><Span2>VIP </Span2>專區</Title3>
            <Text>
                <p style={{margin:0}}>
                  特別精心打造的桌球 <Span3> VIP </Span3> 包廂空間，
                  讓玩樂和歡笑回憶留在美好的空間，
                  更方便拍照留念。目標成為雙北桌球
                  跨足休閒娛樂的業界首選，
                  開創桌球產業藍海。
              </p>
            </Text>
          </TextSize>
          <ImgContainer>
            <Img6 src={img6} alt="" />
          </ImgContainer>
        </TextContainer>

      </BelowArea>







    </Container>

    <MobileContainer>
      <TopContainer>
        <Title1>其他服務</Title1>
        <Title2>Other Service</Title2>
      </TopContainer>
      <TextArea>
        <TextArea2>
          <Title3>桌球俱樂部</Title3>
          <Text>
            <TextText>合作機構：華江高中</TextText>
            <TextText>聚集桌球愛好打手</TextText>
            <TextText>舉辦活動分享知識增加凝聚力</TextText>
          </Text>

          <ImgContainer>
            <MobileImg src={img1} alt="" />
          </ImgContainer>
        </TextArea2>
      </TextArea>

      <TextArea>
        <TextArea2>
          <Title3>場地租借</Title3>
          <Text>
            <TextText>平日上午包場優惠</TextText>
            <TextText>歡迎洽談，提早預約</TextText>
            <TextText>平日 14:00–21:00 與周末租桌服務</TextText>
          </Text>
          <ImgContainer>
            <MobileImg src={img2} alt="" />
          </ImgContainer>
        </TextArea2>
      </TextArea>


      <TextArea>
        <TextArea2>
          <Title3>球具販售</Title3>
          <Text>
            依據需求協助搭配和製作球具，
            以達到學習和運動成效為主要目的。
          </Text>
          <ImgContainer>
            <MobileImg src={img3} alt="" />
          </ImgContainer>
        </TextArea2>
      </TextArea>


      <TextArea>
        <TextArea2>
          <Title3>場館加盟與聯盟合作</Title3>
          <Text>
            提供系統化的 SOP 協助桌球產業發
            展更全面，並且共享產業資源互利，
            提供有心推廣桌球的同業更好的機會。
          </Text>
          <ImgContainer>
            <MobileImg src={img4} alt="" />
          </ImgContainer>
        </TextArea2>
  
      </TextArea>   

      <TextArea>
        <TextArea2>
          <Title3>趣味活動</Title3>
          <Text>
            <TextText>桌球結合趣味競賽</TextText>
            <TextText>各式行銷活動協辦</TextText>
            <TextText>自媒體 / 媒體合作</TextText>
          </Text>
          <ImgContainer>
            <MobileImg src={img5} alt="" />
          </ImgContainer>
        </TextArea2>
      </TextArea>   

      <TextArea>
        <TextArea2>
          <Title3>VIP 專區</Title3>
          <Text>
            特別精心打造的桌球 VIP 包廂空間，
            讓玩樂和歡笑回憶留在美好的空間，
            更方便拍照留念。目標成為雙北桌球
            跨足休閒娛樂的業界首選，
            開創桌球產業藍海。
          </Text>
          <ImgContainer>
            <MobileImg src={img6} alt="" />
          </ImgContainer>
        </TextArea2>
      </TextArea> 

    </MobileContainer>
  </PageContainer>;
};

export default OtherService;
