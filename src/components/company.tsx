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
  justify-content:center;
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

  
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items:center;
    margin-left:0px;
    width:100%;
    margin-top:-12px;
    
    
   
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
    width:100%;
    height:84px;
    margin-top:0px;
    
    
    

  ;
  }
`;

const Background2 = styled.div`
 background: #F5F6F6;
 display:flex;  
 justify-content: center;
 align-items: center;
 width:373px;
 height:977px;

 
  @media screen and (max-width: 768px) {
    width:100%;
    height:84px;
    
  }
`;

const TopLeftArea = styled.div`
 display: flex;
 justify-content: center;
 align-items:center;




  @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
    align-items: center;
    margin-left:0px;
    height: auto;
    width:100%;
    padding-bottom:32px;
    

   


  
   
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
    width:100%;
    height: auto;
    display:flex;  
    justify-content: center;
    align-items: flex-start;
    margin-top:0px;
    padding-bottom:33px;
   
   

  }
`;

const TextArea1 = styled.div`
  margin-top:28px;
  margin-left:48px;
  
  @media screen and (max-width: 768px) {
    width:100%;
    height:auto;
    margin-left:0px;
    padding-left:24px;
    padding-right:24px;
    margin-top:4px;

  }
`;

const TextArea2 = styled.div`
  display:flex;
  justify-content:center;
  margin-left:30px;


  @media screen and (max-width: 768px) {
    margin-left:0px;
  }
`;

const TextArea3 = styled.div`
  margin-top:28px;
  margin-left:70px;


  @media screen and (max-width: 768px) {
   margin-left:0px;
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

const Text1 = styled.p`
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
    font-size: 16px;
    line-height: 32px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    margin-top:0px;
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
    font-size: 16px;
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
      font-family: 'Noto Sans TC';
      font-style: normal;
      font-weight: 900;
      font-size: 20px;
      line-height: 36px;
      letter-spacing: 0.03em;
      display: flex;
      align-items: center;
      text-align: center;
 
   
   
 
  }
`;

const Title02 = styled.p`
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
      display: flex;
      align-items: center;
      text-align: center;
      margin-bottom:25px;
  }
`;

const TopBelow = styled.div`
  margin-left:160px;
   @media screen and (max-width: 768px) {
   display:flex;
   justify-content:flex-start;
   align-items:flex-start;
   flex-direction:column;
   padding-left:24px;
   padding-right:24px;
   margin-left:0px;
   width:auto;
   margin-top:6px;
  
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
    width:100%;
    height:auto;
    padding-bottom:28px;
  }

`;

const SmallTitle = styled.p`
  font-family: 'Noto Sans TC';
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
    margin-top:-10px;
    margin-top:-2px;
  }
`;

const SmallTitle1 = styled.p`
  font-family: 'Noto Sans TC';
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
    margin-top:-10px;
  }
`;


const MobileContainer = styled.div`
  display:none;
 @media screen and (max-width: 768px) {
    background: #38D430;
    /* width:100%; */
    height:auto;
    display:flex;
    justify-content:center;
    flex-direction: column;
    align-items: center;
    padding-left:24px;
    padding-right:24px;
    padding-top:40px;
    padding-bottom:40px;

  
  
    
   
  }

`;

const Column = styled.div`
    
 @media screen and (max-width: 768px) {
    display:flex;
    flex-direction: column;
    margin-top:6px;
  }
`;

const Column2 = styled.div`
    
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
    display:flex;
    justify-content: center;
    align-items:center;
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
   margin-top:-26px;
  }
`;

const Background = styled.div`
  background: #38D430;
  width:100%;
  height:1388px;
  padding-top:30px;
  padding-bottom:47px;
 
`;

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
    font-size: 14px;
    line-height: 28px;
    letter-spacing: 0.06em;
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
  width:100%;
 
  


 
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

const Text11 = styled.div`
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
  display:none;
  @media screen and (max-width: 768px) {
   margin-top:54px;
   display:flex;
   flex-direction: column;
   width:auto;
   margin-bottom:40px;
  }

`;


const AlignContener = styled.div`
  @media screen and (max-width: 768px) {
   margin-top:7px;
  
 
  }


`;

const AlignContener2 = styled.div`
  @media screen and (max-width: 768px) {
   margin-top:22px;
  
 
  }


`;




/* desktop thw newest info style end */
const Company = () => {
  return <PageContainer id="company">
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
                <Text12>連絡方式</Text12>
                <Text12>Line</Text12>
                <Text12>電話</Text12>
                <Text12>信箱</Text12>
                <Text12>總公司客服時間</Text12>
                <Text12>創辦人 / 總教練</Text12>
              </TextArea1>
              <TextArea3>
                <Text32>新北市蘆洲區長樂路<Span>106</Span>號<Span>3</Span>樓</Text32>
                <Text32>（請優先使用 <Span>Line</Span> 聯繫）</Text32>
                <Text32><Span>@869usyqy</Span></Text32>
                <Text32><Span>02-8286-1011</Span></Text32>
                <Text32><Span>playpp2018@gmail.com</Span></Text32>
                <Text32>週一至週五 <Span>10:00–19:00</Span>（週末請撥各館電話）</Text32>
                <Text32>郭則寬（阿寬）</Text32>
              </TextArea3>
            </TextArea2>
          </TextArea>

        </TopLeftArea>

        <BelowArea>
          <Background2>
            <Title>＃ 據點資訊</Title>
          </Background2>

          <BelowTextContainer>
            <TopBelow>
              <Title2>分館資訊</Title2>

              <Time>
                <SmallTitle>各館營業時間</SmallTitle>
                <Text22>
                  週一至週五 <Span>13:00–21:00</Span>（會視課程狀況開店與關店；周一二課程較少會視情況調整；部分早上有開早鳥班）
                  <br />
                  週六日 <Span>9:00–18:00</Span>（視情況提早和延後開關店）
                </Text22>
              </Time>

              <Shop>
                <SmallTitle><Span2>Let's Play</Span2> 蘆洲店 － 捷運蘆洲 </SmallTitle>
                <Text2>新北市蘆洲區長樂路<Span>106</Span>號<Span>3</Span>樓</Text2>
                <Text2>Line：<Span>@869usyqy</Span></Text2>
                <Span>02-8286-1011</Span>
              </Shop>

              <Shop1>
                <SmallTitle><Span2>Let's Play</Span2> 林口店</SmallTitle>
                <Text2>資訊更新中，請洽 Line：<Span>@869usyqy</Span></Text2>
              </Shop1>
            </TopBelow>

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
                <Text33>新北市蘆洲區長樂路<Span1>106</Span1>號<Span1>3</Span1>樓</Text33>
              </Column>
              <Column2>
                <Text3>連絡方式</Text3>
                <Text11>（請優先使用 Line 聯繫）</Text11>
              </Column2>

              <Column>
                <Text3>Line</Text3>
                <Text11><Span1>@869usyqy</Span1></Text11>
              </Column>

              <Column>
                <Text3>電話</Text3>
                <Text11><Span1>02-8286-1011</Span1></Text11>
              </Column>

              <Column>
                <Text3>信箱</Text3>
                <Text11> <Span1>playpp2018@gmail.com</Span1></Text11>
              </Column>

              <Column2>
                <Text3>總公司客服時間</Text3>
                <Text33>週一至週五 <Span1> 10:00–19:00</Span1>（週末請撥各館電話）</Text33>
              </Column2>

              <Column2>
                <Text3>創辦人 / 總教練</Text3>
                <Text33>郭則寬（阿寬）</Text33>
              </Column2>
            </TextArea1>

          </TextArea>
        </TopContainer>


      </TopLeftArea>

      <BelowArea>
        <Background2>
          <Title>＃ 據點資訊</Title>
        </Background2>
        <BelowTextContainer>
          <TopBelow>
            <Title02>分館資訊</Title02>

            <AlignContener>
              <SmallTitle1>各館營業時間</SmallTitle1>
              <Text>
                週一至週五 <Span1>13:00–21:00</Span1>（會視課程狀況開店與關店；周一二課程較少會視情況調整；部分早上有開早鳥班）
                <br />
                週六日 <Span1>9:00–18:00</Span1>（視情況提早和延後開關店）
              </Text>
            </AlignContener>

            <AlignContener2>
              <SmallTitle><Span>Let's Play </Span> 蘆洲店 － 捷運蘆洲</SmallTitle>
              <Text>新北市蘆洲區長樂路<Span1>106</Span1>號3樓</Text>
              <Text>Line：<Span1>@869usyqy</Span1></Text>
              <Text1><Span1>02-8286-1011</Span1></Text1>

            </AlignContener2>

            <AlignContener2>
              <SmallTitle><Span>Let's Play </Span> 林口店</SmallTitle>
              <Text>資訊更新中，請洽 Line：<Span1>@869usyqy</Span1></Text>
            </AlignContener2>
          </TopBelow>

        </BelowTextContainer>


      </BelowArea>

    </MobileContainer>

  </PageContainer>;
};

export default Company;
