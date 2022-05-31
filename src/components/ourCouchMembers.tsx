import React from "react";
import styled from "styled-components";
import img1 from "../assets/ourCouchMenber/img1.png"
import img2 from "../assets/ourCouchMenber/img2.png"
import img3 from "../assets/ourCouchMenber/img3.png"
import img4 from "../assets/ourCouchMenber/img4.png"
import img5 from "../assets/ourCouchMenber/img5.png"
import img6 from "../assets/ourCouchMenber/img6.png"
import img7 from "../assets/ourCouchMenber/img7.png"
import img8 from "../assets/ourCouchMenber/img8.png"
import img11 from "../assets/ourCouchMenber/img-1.png"
import img22 from "../assets/ourCouchMenber/img-2.png"
import img33 from "../assets/ourCouchMenber/img-3.png"
import img44 from "../assets/ourCouchMenber/img-4.png"
import img55 from "../assets/ourCouchMenber/img-5.png"
import img66 from "../assets/ourCouchMenber/img-6.png"
import img77 from "../assets/ourCouchMenber/img-7.png"
import img88 from "../assets/ourCouchMenber/img-8.png"



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
 padding-bottom:80px;
 width:100%;
 display:flex;
 justify-content:center;
 align-items: center;
 margin-left:-65px;

   @media screen and (max-width: 768px) {
    display:none;
  }
 
`;

const PicImg = styled.img`
  width:310px;
  height:300px;
  margin-left:80px;
    @media screen and (max-width: 768px) {
    width:211px;
    height:201px;
  }
`;



const Row1 = styled.div`
  display: flex;
  justify-content:center;
  margin-top:-65px;
    @media screen and (max-width: 768px) {
    display: flex;
    justify-content:center;
    flex-direction: column;
  
  }
`;

const Row2 = styled.div`
  display: flex;
  flex-direction: row;
  margin-top:50px;
  justify-content:center;
  align-items:center;
    @media screen and (max-width: 768px) {
    
  }
`;

const Row3 = styled.div`
  display: flex;
  justify-content:center;
  flex-direction: row;
  margin-top:50px;
  margin-bottom:94px;
    @media screen and (max-width: 768px) {
    
  }
`;

const Picture = styled.div`
  width:100%;
 
    @media screen and (max-width: 768px) {
     display:none;
 
  }
`;

const MobileContainer = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
  margin-top:17px;
  
   
  @media screen and (min-width: 768px) {
    display:none;
   
   
   
  }
`;

const Text = styled.p`
  margin-left:150px;
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;  
  @media screen and (max-width: 768px) {
   margin-left:0px;
   display:flex;
   flex-direction: column;
   margin-right:100px;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   display: flex;
   justify-content:center;
   align-items: center;
   letter-spacing: 0.03em;
   color: #1A1A1A;

  }
`;

const TextEVA = styled.p`
  margin-left:10px;
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-left:170px;  
  @media screen and (max-width: 768px) {
   margin:0px;
   display:flex;
   flex-direction: column;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   display: flex;
   align-items: center;
   letter-spacing: 0.03em;
   color: #1A1A1A;

  }
`;


const Text2 = styled.p`
  margin-left:200px;
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-left:150px;
  @media screen and (max-width: 768px) {
   margin-left:0px;
   display:flex;
   flex-direction: column;
   font-family: 'Noto Sans TC';
   font-style: normal;
   font-weight: 900;
   font-size: 20px;
   line-height: 36px;
   display: flex;
   justify-content:center;
   align-items: center;
   letter-spacing: 0.03em;
   color: #1A1A1A;

  }
  
`;

const Span = styled.span`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-left:10px;
  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    display: flex;
    align-items: flex-start;
    letter-spacing: 0.02em;
    color: #1A1A1A;
    width:100px;
    margin-left:60px;
  }
`;



const Span3 = styled.span`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  margin-left:-2px;
  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    display: flex;
    align-items: flex-start;
    letter-spacing: 0.02em;
    color: #1A1A1A;
    width:100px;
    margin-left:60px;
  }
`;


const Couch = styled.div`
  margin-left:50px;

`;

const SpanEVA = styled.span`
  font-family: 'Futura';
  font-weight:500;
  font-size:20px;
  line-height:36px;
  letter-spacing:3%;
  margin-left:10px;
`;

const Members = styled.div`
@media screen and (max-width: 768px) {
  display: flex;
  flex-direction: row;
  justify-content:flex-start;
  align-items:center;
  margin-top:20px;
   
  }
  
`
const Members2 = styled.div`
@media screen and (max-width: 768px) {
  display: flex;
  flex-direction: row;
  justify-content:flex-end;
  align-items:center;
  margin-top:20px;
   
  }
  
`

const MemberNameLeft = styled.p`
  @media screen and (max-width: 768px) {
  margin: 0;
  font-family: 'Noto Sans TC';
  font-weight:900;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 3%;
  color: #1A1A1A;
  display:flex;
  justify-content:flex-start; 
    }
`;

const MemberNameRight = styled.p`
  @media screen and (max-width: 768px) {
  margin: 0;
  font-family: 'Noto Sans TC';
  font-weight:900;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 3%;
  color: #1A1A1A;
  display:flex;
  justify-content:flex-end; 
    }
`;

const NickName = styled.p`
  @media screen and (max-width: 768px) {
    margin: 0;
    font-family: 'Futura';
    font-weight:500;
    font-size: 16px;
    line-height: 30px;
    letter-spacing: 2%;
    color: #1A1A1A;
    }
`;

const SpanEva = styled.span`
  @media screen and (max-width: 768px) {
    margin: 0;
    font-family: 'Futura';
    font-weight:500;
    font-size: 16px;
    line-height: 30px;
    letter-spacing: 2%;
    color: #1A1A1A;
    }
`;

const NameComponentLeft = styled.div`
  display: flex;
  flex-Direction: column; 
  margin-left: 20px;
`;

const NameComponentRight = styled.div`
  display: flex;
  flex-Direction: column;
  margin-Right: 20px;
`;


const MemberPic = styled.img`
  width: 211px;
  height: 201px; 

`;


const PictureContainer = styled.div`
   @media screen and (max-width: 768px) {
   width:80%
    }

`;









/* desktop thw newest info style end */
const OurCouchMembers = () => {
  return <PageContainer>
    <Container>
      <Picture>
        <Row1>
          <Couch>
            <PicImg src={img1} alt="" />
            <TextEVA>呂昀<Span3><SpanEVA>Eva</SpanEVA></Span3></TextEVA>
          </Couch>

          <Couch>
            <PicImg src={img2} alt="" />
            <Text>鍾達威<Span>威廉教練</Span></Text>
          </Couch>

          <Couch>
            <PicImg src={img3} alt="" />
            <Text>林培中<Span>派派教練</Span></Text>
          </Couch>
        </Row1>

        <Row2>
          <Couch>
            <PicImg src={img4} alt="" />
            <Text2>郭則寬<Span>阿寬教練</Span></Text2>
          </Couch>

          <Couch>
            <PicImg src={img5} alt="" />
            <Text2>林晏先<Span>先先教練</Span></Text2>
          </Couch>


        </Row2>

        <Row3>
          <Couch>
            <PicImg src={img6} alt="" />
            <Text>顏兆寅<Span>小顏教練</Span></Text>
          </Couch>

          <Couch>
            <PicImg src={img7} alt="" />
            <Text>林政蔚<Span>政蔚教練</Span></Text>
          </Couch>

          <Couch>
            <PicImg src={img8} alt="" />
            <Text>夏振凱<Span>凱凱教練</Span></Text>
          </Couch>
        </Row3>
      </Picture>


    </Container>

    <MobileContainer>
      <PictureContainer>
        <Members>
          <MemberPic src={img11} alt="" />
          <NameComponentLeft>
            <MemberNameLeft>呂昀</MemberNameLeft>
            <NickName><SpanEva>Eva </SpanEva>教練</NickName>
          </NameComponentLeft>

        </Members>

        <Members2>

          <NameComponentRight>
            <MemberNameRight>鍾達威</MemberNameRight>
            <NickName>威廉教練</NickName>
          </NameComponentRight>
          <MemberPic src={img22} alt="" />

        </Members2>

        <Members>
          <MemberPic src={img33} alt="" />
          <NameComponentLeft>
            <MemberNameLeft>林培中</MemberNameLeft>
            <NickName>派派教練</NickName>
          </NameComponentLeft>


        </Members>

        <Members2>

          <NameComponentRight>
            <MemberNameRight>郭則寬</MemberNameRight>
            <NickName>阿寬教練</NickName>
          </NameComponentRight>
          <MemberPic src={img44} alt="" />

        </Members2>

        <Members>
          <MemberPic src={img55} alt="" />
          <NameComponentLeft>
            <MemberNameLeft>林晏先</MemberNameLeft>
            <NickName>派派教練</NickName>
          </NameComponentLeft>

        </Members>

        <Members2>

          <NameComponentRight>
            <MemberNameRight>顏兆寅</MemberNameRight>
            <NickName>小顏教練</NickName>
          </NameComponentRight>
          <MemberPic src={img66} alt="" />

        </Members2>

        <Members>
          <MemberPic src={img77} alt="" />
          <NameComponentLeft>
            <MemberNameLeft>林政蔚</MemberNameLeft>
            <NickName>政蔚教練</NickName>
          </NameComponentLeft>


        </Members>

        <Members2>

          <NameComponentRight>
            <MemberNameRight>夏振凱</MemberNameRight>
            <NickName>凱凱教練</NickName>
          </NameComponentRight>
          <MemberPic src={img88} alt="" />

        </Members2>
      </PictureContainer>
    </MobileContainer>
  </PageContainer>;
};

export default OurCouchMembers;
