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
  margin-top:44px;
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
  margin-top:40px;
  margin-left:30px;
  
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items:center;
    margin-left:0px;
     margin-top:20px;

  }

`;

const Background1 = styled.div`
 background:#F5F6F6;
 display:flex;  
 justify-content: center;
 align-items: center;
 margin-top:50px;
 width:373px;
 height:288px;
 
 
  @media screen and (max-width: 768px) {
    width:327px;
    height:84px;
    margin-top:-8px;
  ;
  }
`;

const Background2 = styled.div`
 background: #F5F6F6;
 display:flex;  
 justify-content: center;
 width:373px;
 height:977px;
 align-items: center;
 
  @media screen and (max-width: 768px) {
    width:327px;
    height:84px;
 
   
    
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
    margin-left:0px;
   
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
    width:279px;
    height:468px;
    display:flex;  
    justify-content: center;
    align-items:center;
    margin-top:0px;
    padding-left:24px;
    padding-right:24px;
  }
`;

const TextArea1 = styled.div`
  margin-top:28px;
  margin-left:48px;
  
  @media screen and (max-width: 768px) {
   margin-bottom:30px;
   margin-left:0px;
   margin-top:-9px;
  }
`;

const TextArea2 = styled.div`
  display:flex;
  justify-content:center;
  margin-left:30px;


  @media screen and (max-width: 768px) {
    
  }
`;

const TextArea3 = styled.div`
  margin-top:28px;
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
    font-size: 14px;
    line-height: 28px;
    letter-spacing: 0.06em; 
    color: #3C3D3D;
   
  
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
  margin:0px;
  padding:0px;
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
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin:0px;
  padding:0px;
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

const Text12 = styled.p`
  font-family: 'Noto Sans TC';
  font-weight: 500;
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.64px;
  color: #3C3D3D;
  margin:0px;
  margin-top:12px;
  padding:0px;
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

const Text32 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin:0px;
  margin-top:12px;
  padding:0px;
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
    margin-top:0px;
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
  margin:0px 8px 0px 0px;

   @media screen and (max-width: 768px) {
   
  }
`;

const TopBelow = styled.div`
  margin-left:160px;
   @media screen and (max-width: 768px) {
   display:flex;
   justify-content:flex-start;
   align-items:flex-start;
   flex-direction:column;
   margin-top:24px;
   padding-left:24px;
   padding-right:24px;
   margin-left:0px;
  }


`;

const UnderBelow = styled.div`
  margin-left:160px;
  margin-top:35px;

 @media screen and (max-width: 768px) {
    margin-left:0px;
    padding-left:24px;
    padding-right:24px;
  }
  
`;


const Title2 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  letter-spacing: 0.04em;
  margin:40px 0px 0px 0px;

  color: #1A1A1A;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 18px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin:0px;
  
    
  }
`;

const BelowTextContainer = styled.div`
 background: #FFFFFF;
 width:827px;
 height:977px;
 



  @media screen and (max-width: 768px) {
    width:327px;
    height:993px;
    padding-left:0px;
    margin-bottom:80px;
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
  margin-bottom:0px;
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

const SmallTitle1 = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #005CB9;
  margin-bottom:0px;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 28px;
    letter-spacing: 0.06em;
    color: #005CB9;
    margin-top:0px;
  }
`;


const MobileContainer = styled.div`
  display:none;
 @media screen and (max-width: 768px) {
    background: #38D430;
    width:100%;
    height:1709px;
    display:flex;
    justify-content:center;
    flex-direction: column;
    align-items: center;
    margin-top:40px;
 
    
   
  }

`;

const Column = styled.div`
    
 @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
    margin-top:6px;
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
  @media screen and (max-width: 768px) {
   font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    text-align: center;
    letter-spacing: 4%;
    color: #1A1A1A;
  }
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
  margin-bottom:60px;
  @media screen and (max-width: 768px) {
   font-family: 'Futura';
   font-style: normal;
   font-weight: 700;
   font-size: 26px;
   line-height: 40px;
   text-align: center;
   letter-spacing: 4%;
   margin-bottom:0px;
  }
`;

const Background = styled.div`
  background: #38D430;
  width:100%;
  height:1388px;
  padding-top:30px;
  padding-bottom:47px;
 
`;

// const Num = styled.p`
//   font-family: 'Futura';
//   font-style: normal;
//   font-weight: 500;
//   font-size: 18px;
//   line-height:32px;
//   letter-spacing: 0.04em;
//   color: #1A1A1A;
//   margin:0px;
// `;

const Span = styled.span`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
   @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #005CB9;
  }
`;

const Span1 = styled.span`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
   @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color:  #1A1A1A;
  }
`;



const TopContainer = styled.div`
  
 @media screen and (max-width: 768px) {
  display:flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin-top:-92px;
 
  }
`;

const Text22 = styled.div`
font-family: 'Noto Sans TC';
font-weight: 500;
font-size: 18px;
line-height: 32px;
letter-spacing: 0.72px;
color:#1A1A1A;


`;

const Time = styled.div`
 margin-top:20px;
`;

const Shop = styled.div`
margin-top:20px;


`;

const Shop1 = styled.div`
margin-top:20px;


`;

const Shop2 = styled.div`
margin-top:20px;


`;

const Text33 = styled.div`
  font-family: 'Noto Sans TC';
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-top:-14px;
   

  }
`;

const Span2 = styled.span`
font-family: 'Futura';
font-weight: 500;
font-size: 16px;
line-height: 32px;
letter-spacing: 0.04em;
color: #005CB9;
`;

const MobileTitle = styled.div`
  @media screen and (max-width: 768px) {
   margin-top:54px;
 ;
  }

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
            <TextArea2>
              <TextArea1>
                <Text12>地址</Text12>
                <Text12>連絡電話</Text12>
                <Text12>信箱</Text12>
                <Text12>總公司客服時間</Text12>
                <Text12>創辦人 / 總教練</Text12>
              </TextArea1>
              <TextArea3>
                <Text32>新北市蘆洲區長樂路<Span>106</Span>號<Span>3</Span>樓</Text32>
                <Text32><Span>0988 521 012</Span></Text32>
                <Text32><Span>playpp2018@gmail.com</Span></Text32>
                <Text32>週一至週五 <Span>10:00–19:00</Span>（週末請撥各館電話）</Text32>
                <Text32>郭教練 <Span>0988 521 012</Span></Text32>
              </TextArea3>
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

              <Time>
                <SmallTitle>各館營業時間</SmallTitle>
                <Text22>週一至週五 <Span> 13:00–21:00 </Span>　週六日<Span> 9:00–19:00  </Span></Text22>
              </Time>

              <Shop>
                <SmallTitle><Span2>Let's Play</Span2> 蘆洲店 － 捷運蘆洲 </SmallTitle>
                <Text2>新北市蘆洲區長樂路<Span>106</Span>號<Span>3</Span>樓</Text2>
                <Span>02 8286 1011</Span>
              </Shop>

              <Shop1>
                <SmallTitle><Span2>Let's Play</Span2> 東門店<Span2> X </Span2>  東門桌球 － 捷運東門 </SmallTitle>
                <Text2>台北市中正區金山南路一段<Span>121</Span>號</Text2>
                <Span>02 2356 7106</Span>
              </Shop1>

              <Shop1>
                <SmallTitle><Span2>Let's Play</Span2> 新莊店 <Span2>X</Span2> 卓越乒乓 － 捷運頭前庄</SmallTitle>
                <Text2>台北市新莊區民樂街<Span>37</Span>號<Span>B1</Span></Text2>
                <Span>02 2990 0566</Span>
              </Shop1>

              <Shop1>
                <SmallTitle><Span2>Let's Play</Span2> 善導寺店 <Span2>X</Span2> 乒乓世界 － 捷運善導寺</SmallTitle>
                <Text2>台北市中正區杭州南路一段<Span>63</Span>號<Span>B1</Span></Text2>
                <Span>02 2391 9659</Span>
              </Shop1>
            </TopBelow>

            <UnderBelow>
              <Title22>聯盟場館經營</Title22>
              <Shop2>
                <SmallTitle><Span2>ONWARD TT</Span2> 乒乓吧 <Span2> X Let's Play</Span2> － 捷運南港 <Span2> & </Span2> 昆陽</SmallTitle>
                <Text2>台北市南港區南港路二段<Span>141</Span>號<Span>1</Span>樓</Text2>
                <Span>02 2651 0652</Span>
              </Shop2>

              <Shop2>
                <SmallTitle>舞動華江高中 <Span2> & Let's Play</Span2> － 捷運龍山寺</SmallTitle>
                <Text2>台北市萬華區西藏路<Span>213</Span>號</Text2>
                <Span>02 2339 6689</Span>
              </Shop2>

            </UnderBelow>

          </BelowTextContainer>


        </BelowArea>
      </Background>
    </Container>
    
    <MobileTitle>
      <TitleOne>聯絡我們</TitleOne>
      <TitleTwo>Contact Us</TitleTwo>
    </MobileTitle>


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
                <Text33>新北市蘆洲區長樂路<Span1>106</Span1>106號<Span1>3</Span1>樓</Text33>
              </Column>
              <Column>
                <Text3>連絡電話</Text3>
                <Text33><Span1>0988 521 012</Span1></Text33>
              </Column>

              <Column>
                <Text3>信箱</Text3>
                <Text33> <Span1>playpp2018@gmail.com</Span1></Text33>
              </Column>

              <Column>
                <Text3>總公司客服時間</Text3>
                <Text33>週一至週五 <Span1> 10:00–19:00</Span1>（週末請撥各館電話）</Text33>
              </Column>

              <Column>
                <Text3>創辦人 / 總教練</Text3>
                <Text33>郭教練 <Span1> 0988 521 012</Span1></Text33>
                </Column>
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
            <Title>分館資訊</Title>

            <div>
              <SmallTitle1>各館營業時間</SmallTitle1>
              <Text>週一至週五 <Span1> 13:00–21:00</Span1>　週六日<br /> <Span1> 9:00–19:00</Span1></Text>
            </div>

            <div>
              <SmallTitle><Span>Let's Play </Span> 蘆洲店 － 捷運蘆洲</SmallTitle>
              <Text>台北市中正區金山南路一段121號</Text>
              <Text><Span1> 02 2356 7106</Span1></Text>

            </div>

            <div>
              <SmallTitle><Span>Let's Play </Span> 新莊店 <Span> X </Span> 卓越乒乓 － 捷運頭前庄</SmallTitle>
              <Text>台北市新莊區民樂街37號B1</Text>
              <Text><Span1>02 2990 0566</Span1></Text>

            </div>

            <div>
              <SmallTitle><Span>Let's Play </Span>  善導寺店 <Span> X </Span> 乒乓世界 － 捷運善導寺</SmallTitle>
              <Text>台北市中正區杭州南路一段63號B1</Text>
              <Text><Span1>02 2391 9659</Span1></Text>

            </div>
          </TopBelow>

          <UnderBelow>
            <Title>聯盟場館經營</Title>
            <div>
              <SmallTitle><Span>ONWARD TT </Span> 乒乓吧 <Span> X Let's Play </Span> － 捷運南港 & 昆陽</SmallTitle>
              <Text>台北市南港區南港路二段141號1樓</Text>
              <Text><Span1>02 2651 0652</Span1></Text>
            </div>

            <div>
              <SmallTitle>舞動華江高中<Span> & </Span>  <Span> Let's Play </Span> － 捷運龍山寺</SmallTitle>
              <Text>台北市萬華區西藏路213號</Text>
              <Text> <Span1>02 2339 6689</Span1></Text>
            </div>

          </UnderBelow>

        </BelowTextContainer>


      </BelowArea>

    </MobileContainer>

  </PageContainer>;
};

export default Company;
