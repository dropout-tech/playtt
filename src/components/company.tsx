import React from "react";
import styled from "styled-components";




// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
  background: #38D430;
  width:100%;
  height:100%;
  padding:120px;
`;

const TopArea = styled.div`

`;

const BelowArea = styled.div`

`;

const Background = styled.div`
 background: rgba(207, 210, 211,0.8);
 margin-left:30px;
 width:373px;
 display:flex;  
 justify-content: center;
`;

const TopLeftArea = styled.div`
 display: flex;
 height:300px;
`;

const TextArea = styled.div`
 background: #FFFFFF;
 width:67%;
 padding-left:30px;
  display:flex;  
 justify-content: center;


`;

const TextArea1 = styled.div`
  margin-top:20px;
`;

const TextArea2 = styled.div`
 margin-left:80px;
 margin-top:20px;
`;

const Text = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.04em;
  color: #3C3D3D;
`;

const Title = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 30px;
  line-height: 44px;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;
/* desktop thw newest info style end */
const Company = () => {
  return <PageContainer>
    <Container>
      <TopArea>
        <TopLeftArea>
          <Background>
            <Title>＃ 總公司</Title>
          </Background>
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


      </TopArea>


      <BelowArea>

      </BelowArea>

    </Container>
  
  </PageContainer>;
};

export default Company;
