import React from "react";
import styled from "styled-components";
import bg1440 from "../assets/reserve/bg1440.png";
import bg1280 from "../assets/reserve/bg1280.png";
import bg1024 from "../assets/reserve/bg1024.png";
import bg768 from "../assets/reserve/bg768.png";
import bg414 from "../assets/reserve/bg414.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top:30px;
  padding-bottom:30px;
   @media screen and (max-width: 768px) {
    
  }
`;

const Container = styled.div`
  margin-top:-10px;
  padding-top:60px;
  padding-bottom:40px;
   @media screen and (max-width: 768px) {
    margin-top:-50px;
    padding-bottom:0px;
    width:100%;
  }
`;



const GreenButton = styled.button`
  width:374px;
  height:72px;
  background: #38D430;
  box-shadow: 0px 4px 20px rgba(26, 26, 26, 0.07);
  border:none;
  @media screen and (max-width: 1024px) {
    width:342px;
    height:68px;
    display:flex;
    justify-content:center;
    align-items: center;
 
  }
   @media screen and (max-width: 768px) {
    width:294px;
    height:60px;
    display:flex;
    justify-content:center;
    align-items: center;
    margin-top:150px;
  }
`;

const GreenButton6 = styled.button`
  width:374px;
  height:72px;
  background: #38D430;
  box-shadow: 0px 4px 20px rgba(26, 26, 26, 0.07);
  border:none;
   @media screen and (max-width: 768px) {
    width:211px;
    height:48px;
    display:flex;
    justify-content:center;
    align-items: center;
    margin-top:150px;
  }
`;

const ButtonText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content:center;
  letter-spacing: 0.04em;
  color: #FFFFFF;

   @media screen and (max-width:1024px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 23px;
    line-height: 36px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #FFFFFF;
    margin-top:17px;
  }
  
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.03em;
    color: #FFFFFF;
  }
`;



const BelowText = styled.p`
  font-size:'Noto Sans TC';
  font-weight:500;
  font-size:18px;
  line-height:32px;
  letter-spacing:4%;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.04em;
  color: #3C3D3D;
  margin-top:2px;
   @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 32px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #3C3D3D;
  }
`;

const TextArea1 = styled.div`
 @media screen and (min-width: 1440px) {
  width:100%;
  height:610px;
  display: flex;
  align-items: center;
  justify-content:center;
  flex-direction: column;
  background-image: url('${bg1440}');
  background-size: contain;
  background-repeat: no-repeat;
  background-position:center;
 }
@media screen and (max-width: 1440px) {
  display:none;
 }

 @media screen and (max-width: 1280px) {
  display:none;
 }

 @media screen and (max-width: 1024px) {
 display:none;
 }

 @media screen and (max-width: 768px) {
  display:none;
 }

 @media screen and (max-width: 414px) {
    display:none;
  }
`;

const TextArea2 = styled.div`
 @media screen and (min-width: 1440px) {
  display:none;
 }
@media screen and (max-width: 1440px) {
  width:100%;
  height:610px;
  display: flex;
  align-items: center;
  justify-content:center;
  flex-direction: column;
  background-image: url('${bg1280}');
  background-size: contain;
  background-repeat: no-repeat;
  background-position:center;
 }

 @media screen and (max-width: 1280px) {
  display:none;
 }

 @media screen and (max-width: 1024px) {
  display:none;
 }

  @media screen and (max-width: 768px) {
   display:none;
 }
  @media screen and (max-width: 414px) {
  display:none;
  }
`;

const TextArea3 = styled.div`
 @media screen and (min-width: 1440px) {
  display:none;
 }
@media screen and (max-width: 1440px) {
  display:none;
 }

 @media screen and (max-width: 1280px) {
  width:100%;
  height:610px;
  display: flex;
  align-items: center;
  justify-content:center;
  flex-direction: column;
  background-image: url('${bg1024}');
  background-size: contain;
  background-repeat: no-repeat;
  background-position:center;
 }

 @media screen and (max-width: 1024px) {
  display:none;
 }

  @media screen and (max-width: 768px) {
  display:none;
 }

  @media screen and (max-width: 414px) {
  display:none;

  }
`;

const TextArea4 = styled.div`
 @media screen and (min-width: 1440px) {
display:none;
 }
@media screen and (max-width: 1440px) {
display:none;
 }

 @media screen and (max-width: 1280px) {
  display:none;
 }

 @media screen and (max-width: 1024px) {
    width:100%;
    height:610px;
    display: flex;
    align-items: center;
    justify-content:center;
    flex-direction: column;
    background-image: url('${bg768}');
    background-size: contain;
    background-repeat: no-repeat;
    background-position:center;
  }

  @media screen and (max-width: 768px) {
  display:none;
 }

  @media screen and (max-width: 414px) {
  display:none;
  }
`;

const TextArea5 = styled.div`
 @media screen and (min-width: 1440px) {
  display:none;
 }
@media screen and (max-width: 1440px) {
  display:none;
 }

 @media screen and (max-width: 1280px) {
  display:none;
 }

 @media screen and (max-width: 1024px) {
  display:none;
 }

  @media screen and (max-width: 768px) {
    width:100%;
    height:610px;
    display: flex;
    align-items: center;
    justify-content:center;
    flex-direction: column;
    background-image: url('${bg768}');
    background-size: contain;
    background-repeat: no-repeat;
    background-position:center;
 }

  @media screen and (max-width: 414px) {
    display:none;
   }
`;

const TextArea6 = styled.div`
 @media screen and (min-width: 1440px) {
  display:none;
 }
@media screen and (max-width: 1440px) {
  display:none;
 }

 @media screen and (max-width: 1280px) {
  display:none;
 }

 @media screen and (max-width: 1024px) {
  display:none;
 }

  @media screen and (max-width: 768px) {
  display:none;
 }

  @media screen and (max-width: 414px) {
  background-image: url('${bg414}');
  background-size:contain ;
  background-repeat: no-repeat;
  background-position:center;
  width:100%;
  height:310px;
  display:flex;
  justify-content:center;
  margin-top:119px;
  
  }
`;

const AlignText = styled.div`
 display: flex; 
 align-items: center;
 justify-content:center;
 flex-direction: column;
 margin-top:40px;
;
  @media screen and (max-width: 768px) {
   margin-top:-122px;
  }

`;


const AlignText6 = styled.div`
 display: flex; 
 align-items: center;
 justify-content:center;
 flex-direction: column;
 margin-top:40px;
;
  @media screen and (max-width: 768px) {
   margin-top:-122px;
  }
`;

const Text = styled.div`
  height:60px;
  margin-top:-10px;
   @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    align-items: center;
    margin-top:0px;
  }
`;

const Span = styled.p`
  font-family:'Futura';
  font-weight:500;
  font-size:18px;
  line-height:32px;
  letter-spacing:6%;
  @media screen and (max-width: 768px) {
    font-family:'Futura';
    font-weight:500;
    font-size:18px;
    line-height:32px;
    letter-spacing:4%;
    margin-left:4px;
  }
`;

/* desktop thw newest info style end */
const Reserve = () => {
  return <PageContainer id="reserve">
    <Container>

      <TextArea1>
        <AlignText>
          <GreenButton>
            <Text>
              <ButtonText>立即預約體驗</ButtonText>
            </Text>
          </GreenButton>
          <BelowText>統一由臉書私訊洽詢想預約試上的分店 <Span>Line</Span></BelowText>
        </AlignText>
      </TextArea1>

      <TextArea2>
        <AlignText>
          <GreenButton>
            <Text>
              <ButtonText>立即預約體驗</ButtonText>
            </Text>
          </GreenButton>
          <BelowText>統一由臉書私訊洽詢想預約試上的分店 <Span>Line</Span></BelowText>
        </AlignText>
      </TextArea2>

      <TextArea3>
        <AlignText>
          <GreenButton>
            <Text>
              <ButtonText>立即預約體驗</ButtonText>
            </Text>
          </GreenButton>
          <BelowText>統一由臉書私訊洽詢想預約試上的分店 <Span>Line</Span></BelowText>
        </AlignText>
      </TextArea3>

      <TextArea4>
        <AlignText>
          <GreenButton>
            <Text>
              <ButtonText>立即預約體驗</ButtonText>
            </Text>
          </GreenButton>
          <BelowText>統一由臉書私訊洽詢想預約試上的分店 <Span>Line</Span></BelowText>
        </AlignText>
      </TextArea4>

      <TextArea5>
        <AlignText>
          <GreenButton>
            <Text>
              <ButtonText>立即預約體驗</ButtonText>
            </Text>
          </GreenButton>
          <BelowText>統一由臉書私訊洽詢想預約試上的分店 <Span>Line</Span></BelowText>
        </AlignText>
      </TextArea5>

      <TextArea6>
        <AlignText6> 
          <GreenButton6>
            <Text>
              <ButtonText>立即預約體驗</ButtonText>
            </Text>
          </GreenButton6>
          <BelowText>統一由臉書私訊洽詢想預約試上的分店 <Span>Line</Span></BelowText>
        </AlignText6>
      </TextArea6>


    </Container>
  </PageContainer>;
};

export default Reserve;
