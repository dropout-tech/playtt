import React from "react";
import styled from "styled-components";




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
  background: #38D430;
  height:100%;
  width:100%;
  padding-top:80px;
  padding-bottom: 80px;
  display:flex;
  flex-direction: column;
  align-items: center;
   @media screen and (max-width: 768px) {
    height:98%;
    width:100%;
  }
`;

const TopArea = styled.div`
 @media screen and (max-width: 768px) {
    
  }
`;

const BelowArea = styled.div`
  display: flex;
  justify-content: center;
  margin-top:80px;
  width:80%;
   @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items:center;
    margin-top:50px;
    margin-left:-20px;
  }

`;

const Background1 = styled.div`
 background: rgba(207, 210, 211,0.8);
 display:flex;  
 justify-content: center;
 margin-top:50px;
 height:100%;
 width:19.5%;
 align-items: center;
  @media screen and (max-width: 768px) {
    width:98%;
    height:400px;
  }
`;

const Background2 = styled.div`
 background: rgba(207, 210, 211,0.8);
 display:flex;  
 justify-content: center;
 width:26.7%;
 align-items: center;
  @media screen and (max-width: 768px) {
    width:110%;
    height:84px;
    margin-top:70px;
  }
`;

const TopLeftArea = styled.div`
 height:300px;
 width:90%;
 display: flex;
 justify-content: center;
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items:center;
    width:90%;
    margin-left:-20px;
  }
`;

const TextArea = styled.div`
 background: #FFFFFF;
 width:67%;
 height:100%;
 padding-left:30px;
 display:flex;  
 justify-content: center;
 margin-top:50px;
  @media screen and (max-width: 768px) {
    width:90%;
    margin-top:0px;
    
  }
`;

const TextArea1 = styled.div`
  margin-top:20px;
   @media screen and (max-width: 768px) {
   
   
    
    
  }
`;

const TextArea2 = styled.div`
 margin-top:20px;
 margin-left:90px;
  @media screen and (max-width: 768px) {
    
  }
`;

const Text = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #3C3D3D;
   @media screen and (max-width: 768px) {
     font-size: 14px;
     line-height: 28px;
     letter-spacing: 0.06em;
  }
  
`;

const Text2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #3C3D3D;
   @media screen and (max-width: 768px) {
     font-size: 14px;
     line-height: 28px;
     letter-spacing: 0.06em;
    
  }
  
`;

const Title = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
   @media screen and (max-width: 768px) {
    font-size: 20px;
    line-height: 36px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.03em;
  }
`;

const TopBelow = styled.div`
  width:67%;
 @media screen and (max-width: 768px) {
  
  }

`;

const UnderBelow = styled.div`
 width:67%;
 @media screen and (max-width: 768px) {
    
  }
  
`;


const Title2 = styled.p`
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

const BelowTextContainer = styled.div`
 background: #FFFFFF;
 width:90%;
 padding-left:30px;
 display:flex;  
 flex-direction:column;
 align-items: center;
  @media screen and (max-width: 768px) {
    width:101%;
  }

`;

const SmallTitle = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #005CB9;
   @media screen and (max-width: 768px) {
    
  }
`;

const MobileContainer = styled.div`
  display:none;
 @media screen and (max-width: 768px) {
  
  }

`;

const Column = styled.div`
    
 @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;

  }
`;

/* desktop thw newest info style end */
const Company = () => {
  return <PageContainer>
    <Container>

      <TopLeftArea>
        <Background1>
          <Title>＃ 總公司</Title>
        </Background1>
        <TextArea>
          <TextArea1>
            <Text>地址</Text>
            <Text>連絡電話</Text>
            <Text>信箱</Text>
            <Text>總公司客服時間</Text>
            <Text>創辦人 / 總教練</Text>
          </TextArea1>
          <TextArea2>
            <Text>新北市蘆洲區長樂路106號3樓</Text>
            <Text>0988 521 012</Text>
            <Text>playpp2018@gmail.com</Text>
            <Text>週一至週五 10:00–19:00（週末請撥各館電話）</Text>
            <Text>郭教練 0988 521 012</Text>
          </TextArea2>
        </TextArea>

      </TopLeftArea>



      <BelowArea>


        <Background2>
          <Title>＃ 分店與聯盟</Title>
        </Background2>
        <BelowTextContainer>
          <TopBelow>
            <Title2>分館資訊</Title2>

            <div>
              <SmallTitle>各館營業時間</SmallTitle>
              <Text>週一至週五 13:00–21:00　週六日 9:00–19:00</Text>
            </div>

            <div>
              <SmallTitle>Let's Play 蘆洲店 － 捷運蘆洲</SmallTitle>
              <p>台北市中正區金山南路一段121號</p>
              <p>02 2356 7106</p>

            </div>

            <div>
              <SmallTitle>Let's Play 新莊店 X 卓越乒乓 － 捷運頭前庄</SmallTitle>
              <p>台北市新莊區民樂街37號B1</p>
              <p>02 2990 0566</p>

            </div>

            <div>
              <SmallTitle>Let's Play 善導寺店 X 乒乓世界 － 捷運善導寺</SmallTitle>
              <p>台北市中正區杭州南路一段63號B1</p>
              <p>02 2391 9659</p>

            </div>
          </TopBelow>

          <UnderBelow>
            <Title>聯盟場館經營</Title>
            <div>
              <SmallTitle>ONWARD TT 乒乓吧 X Let's Play － 捷運南港 & 昆陽</SmallTitle>
              <p>台北市南港區南港路二段141號1樓</p>
              <p>02 2651 0652</p>
            </div>

            <div>
              <SmallTitle>舞動華江高中 & Let's Play － 捷運龍山寺</SmallTitle>
              <p>台北市萬華區西藏路213號</p>
              <p>02 2339 6689</p>
            </div>

          </UnderBelow>

        </BelowTextContainer>


      </BelowArea>

    </Container>

    <MobileContainer>
      <TopLeftArea>
        <Background1>
          <Title>＃ 總公司</Title>
        </Background1>
        <TextArea>
          <TextArea1>
            <Column>
              <Text>地址</Text>
              <Text2>新北市蘆洲區長樂路106號3樓</Text2>
            </Column>
            <Column>
              <Text>連絡電話</Text>
              <Text2>0988 521 012</Text2>
            </Column>

            <Column>
              <Text>信箱</Text>
              <Text2>playpp2018@gmail.com</Text2>
            </Column>

            <Column>
              <Text2>總公司客服時間</Text2>
            </Column>

            <Column>
              <Text2>週一至週五 10:00–19:00（週末請撥各館電話）</Text2>
            </Column>

            <Text>創辦人 / 總教練</Text>
            <Text2>郭教練 0988 521 012</Text2>
          </TextArea1>
          
        </TextArea>

      </TopLeftArea>


      <BelowArea>

        <Background2>
          <Title>＃ 分店與聯盟</Title>
        </Background2>
        <BelowTextContainer>
          <TopBelow>
            <Title2>分館資訊</Title2>

            <div>
              <SmallTitle>各館營業時間</SmallTitle>
              <Text>週一至週五 13:00–21:00　週六日 9:00–19:00</Text>
            </div>

            <div>
              <SmallTitle>Let's Play 蘆洲店 － 捷運蘆洲</SmallTitle>
              <Text>台北市中正區金山南路一段121號</Text>
              <Text>02 2356 7106</Text>

            </div>

            <div>
              <SmallTitle>Let's Play 新莊店 X 卓越乒乓 － 捷運頭前庄</SmallTitle>
              <Text>台北市新莊區民樂街37號B1</Text>
              <Text>02 2990 0566</Text>

            </div>

            <div>
              <SmallTitle>Let's Play 善導寺店 X 乒乓世界 － 捷運善導寺</SmallTitle>
              <Text>台北市中正區杭州南路一段63號B1</Text>
              <Text>02 2391 9659</Text>

            </div>
          </TopBelow>

          <UnderBelow>
            <Title>聯盟場館經營</Title>
            <div>
              <SmallTitle>ONWARD TT 乒乓吧 X Let's Play － 捷運南港 & 昆陽</SmallTitle>
              <Text>台北市南港區南港路二段141號1樓</Text>
              <Text>02 2651 0652</Text>
            </div>

            <div>
              <SmallTitle>舞動華江高中 & Let's Play － 捷運龍山寺</SmallTitle>
              <Text>台北市萬華區西藏路213號</Text>
              <Text>02 2339 6689</Text>
            </div>

          </UnderBelow>

        </BelowTextContainer>


      </BelowArea>

    </MobileContainer>

  </PageContainer>;
};

export default Company;
