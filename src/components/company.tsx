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
  height:100%;
  width:100%;
  padding-top:-30px;
  padding-bottom: 80px;
  display:flex;
  flex-direction: column;
  align-items: center;

  @media screen and (max-width: 768px) {
    display:none;
    flex-direction: column;
  }
`;

const BelowArea = styled.div`
  display: flex;
  justify-content: center;
  align-items:center;
  margin-top:70px;
  
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items:center;
    margin-top:-30px;
  }

`;

const Background1 = styled.div`
 background:#F5F6F6;
 display:flex;  
 justify-content: center;
 margin-top:50px;
 width:373px;
 height:288px;

 margin-left:-30px;
 align-items: center;
  @media screen and (max-width: 768px) {
    width:98%;
    height:400px;
    margin-left:-90px;
  }
`;

const Background2 = styled.div`
 background: #F5F6F6;
 display:flex;  
 justify-content: center;
 width:373px;
 height:980px;
 align-items: center;
  @media screen and (max-width: 768px) {
    width:110.025%;
    height:84px;
    margin-top:300px;
    margin-left:-142px;
    
  }
`;

const TopLeftArea = styled.div`

 display: flex;
 justify-content: center;
 align-items:center;
 margin-left:30px;

  @media screen and (max-width: 768px) {
    width:90%;
    margin-top:160px;
    display:flex;
    flex-direction: column;
    align-items: center;
  }
`;

const TextArea = styled.div`
 background: #FFFFFF;
 width:827px;
 height:288px;
 display:flex;  
 justify-content: center;
 margin-top:50px;
  @media screen and (max-width: 768px) {
    width:98%;
    margin-top:0px;
    height:300%;
    padding-left:0px;
    margin-left:-90px

  }
`;

const TextArea1 = styled.div`
  display:flex;
  align-items: center;
  justify-content:center;
  flex-direction: column;
  @media screen and (max-width: 768px) {
   margin-left:20px;
   margin-top:-30px;
   margin-bottom:30px;
  }
`;

const TextArea2 = styled.div`
  display:flex;
  justify-content:center;
  flex-direction: column;
  margin-top:16px;
  margin-left:70px;

  @media screen and (max-width: 768px) {
    
  }
`;

const Text3 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #3C3D3D;
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 20px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    
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
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    
  }
  
`;

const Text2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 8px;
  letter-spacing: 0.72px;
  color: #3C3D3D;
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    
  }
  
`;

const Text33 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 8px;
  letter-spacing: 0.72px;
  color: #3C3D3D;
  margin-top:6px;
  @media screen and (max-width: 768px) {
   
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

const Title22 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  display:flex;
  justify-content:flex-start;

   @media screen and (max-width: 768px) {
   
  }
`;

const TopBelow = styled.div`
  display:flex;
  flex-direction: column;
  justify-content: flex-start;
 

 @media screen and (max-width: 768px) {
   margin-left:-80px;
  }

`;

const UnderBelow = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
  justify-content:center;
 @media screen and (max-width: 768px) {
    margin-left:-80px;
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
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 18px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
  }
`;

const BelowTextContainer = styled.div`
 background: #FFFFFF;
 display:flex;  
 flex-direction:column;
 align-items: center;
 justify-content:center;
 width:827px;
 height:980px;
  @media screen and (max-width: 768px) {
    width:110%;
    padding-left:0px;
    margin-left:-141px;
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
  margin-top:-10px;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 28px;
    letter-spacing: 0.06em;
    color: #005CB9;
  }
`;

const MobileContainer = styled.div`
  display:none;
 @media screen and (max-width: 768px) {
    background: #38D430;
    height:100%;
    width:100%;
    padding-top:80px;
    padding-bottom: 80px;
    display:flex;
    flex-direction: column;
    align-items: center;
    margin-top:-40px;

  }

`;

const Column = styled.div`
    
 @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
  }
`;

const TitleOne = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 36px;
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;

const TitleTwo = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:-30px;
`;

const Background = styled.div`
  background: #38D430;
  width:100%;
  height:1450px;
  padding-top:80px;
 
`;

const Num = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 8px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;

const Span = styled.span`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;



const TopContainer = styled.div`



`;





/* desktop thw newest info style end */
const Company = () => {
  return <PageContainer>
    <Container>
      <TitleOne>聯絡我們</TitleOne>
      <TitleTwo>Contact Us</TitleTwo>
      <Background>
        <TopLeftArea>
          <Background1>
            <Title>＃ 總公司</Title>
          </Background1>
          <TextArea>
            <TextArea1>
              <Text2>地址</Text2>
              <Text2>連絡電話</Text2>
              <Text2>信箱</Text2>
              <Text2>總公司客服時間</Text2>
              <Text2>創辦人 / 總教練</Text2>
            </TextArea1>
            <TextArea2>
              <Text2>新北市蘆洲區長樂路106號3樓</Text2>
              <Num>0988 521 012</Num>
              <Num>playpp2018@gmail.com</Num>
              <Text2>週一至週五 10:00–19:00（週末請撥各館電話）</Text2>
              <Text33>郭教練 <Span>0988 521 012</Span></Text33>
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
                <Text>週一至週五 <Span>13:00–21:00</Span>　週六日<Span> 9:00–19:00</Span></Text>
              </div>

              <div>
                <SmallTitle>Let's Play 蘆洲店 － 捷運蘆洲</SmallTitle>
                <Text2>台北市中正區金山南路一段121號</Text2>
                <Num>02 2356 7106</Num>
              </div>

              <div>
                <SmallTitle>Let's Play 新莊店 X 卓越乒乓 － 捷運頭前庄</SmallTitle>
                <Text2>台北市新莊區民樂街37號B1</Text2>
                <Num>02 2990 0566</Num>
              </div>

              <div>
                <SmallTitle>Let's Play 善導寺店 X 乒乓世界 － 捷運善導寺</SmallTitle>
                <Text2>台北市中正區杭州南路一段63號B1</Text2>
                <Num>02 2391 9659</Num>
              </div>
            </TopBelow>

            <UnderBelow>
              <Title22>聯盟場館經營</Title22>
              <div>
                <SmallTitle>ONWARD TT 乒乓吧 X Let's Play － 捷運南港 & 昆陽</SmallTitle>
                <Text2>台北市南港區南港路二段141號1樓</Text2>
                <Num>02 2651 0652</Num>
              </div>

              <div>
                <SmallTitle>舞動華江高中 & Let's Play － 捷運龍山寺</SmallTitle>
                <Text2>台北市萬華區西藏路213號</Text2>
                <Num>02 2339 6689</Num>
              </div>

            </UnderBelow>

          </BelowTextContainer> 


        </BelowArea>
      </Background>
    </Container>

    <MobileContainer>
      <TopLeftArea>
        <TopContainer>
          <Background1>
            <Title>＃ 總公司</Title>
          </Background1>
          <TextArea>
            <TextArea1>
              <Column>
                <Text3>地址</Text3>
                <Text3>新北市蘆洲區長樂路106號3樓</Text3>
              </Column>
              <Column>
                <Text3>連絡電話</Text3>
                <Text3>0988 521 012</Text3>
              </Column>

              <Column>
                <Text3>信箱</Text3>
                <Text3>playpp2018@gmail.com</Text3>
              </Column>

              <Column>
                <Text3>總公司客服時間</Text3>
              </Column>

              <Column>
                <Text3>週一至週五 10:00–19:00（週末請撥各館電話）</Text3>
              </Column>

              <Text3>創辦人 / 總教練</Text3>
              <Text3>郭教練 0988 521 012</Text3>
            </TextArea1>

          </TextArea>
        </TopContainer>


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
