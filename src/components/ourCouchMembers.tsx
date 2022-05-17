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
    width:181px;
    height:181px;
  }
`;

const PicImg2 = styled.img`
  width:310px;
  height:300px;
  margin-left:80px;
    @media screen and (max-width: 768px) {
    width:181px;
    height:181px;
    margin-left:-100px;
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
    margin-left:40px;
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
  margin-left:5px;
  width:327px;
  
   
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
   align-items: center;
   letter-spacing: 0.03em;
   color: #1A1A1A;

  }
`;

const TextEVA = styled.p`
  margin-left:170px;
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
   align-items: center;
   letter-spacing: 0.03em;
   color: #1A1A1A;

  }
`;

const Text11 = styled.p`
  margin-left:170px;
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
   align-items: center;
   letter-spacing: 0.03em;
   color: #1A1A1A;
   margin-left:-45px;

  }
`;

const Text111 = styled.p`
  margin-left:170px;
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
   align-items: center;
   letter-spacing: 0.03em;
   color: #1A1A1A;
   margin-left:-20px;

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

const Span1 = styled.span`
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
    margin-left:40px;
  }
`;

const Span2 = styled.span`
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
    align-items: center;
    letter-spacing: 0.02em;
    color: #1A1A1A;
    width:100px;
    margin-left:30px;
    
  
    
  }
`;

const Pic = styled.div`
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    flex-direction: row;
    margin-top:20px;
  }
`;

const Pic2 = styled.div`
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content:center;
    flex-direction: row;
    margin-top:20px;
  }
`;


const Name1 = styled.div`

  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    margin-top:40px;
    margin-left:20px;
  }
  
`;
const Name2 = styled.div`

  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    margin-top:40px;
    margin-left:100px;
  }
  
`;

const Couch = styled.div`
  margin-left:50px;

`;




/* desktop thw newest info style end */
const OurCouchMembers = () => {
  return <PageContainer>
    <Container>
      <Picture>
        <Row1>
          <Couch>
            <PicImg src={img1} alt="" />
            <TextEVA>呂昀<Span>Eva教練</Span></TextEVA>
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
      <MobileContainer>
        <Row1>
          <Pic>
            <PicImg src={img1} alt="" />
            <Text>呂昀<Span>Eva教練</Span></Text>
          </Pic>

          <div>
            <Text>鍾達威<Span>威廉教練</Span></Text>
            <PicImg src={img2} alt="" />

          </div>

          <div>
            <PicImg src={img3} alt="" />
            <Text>林培中<Span>派派教練</Span></Text>
          </div>

          <div>
            <Text2>郭則寬<Span>阿寬教練</Span></Text2>
            <PicImg src={img4} alt="" />

          </div>

          <div>
            <PicImg src={img5} alt="" />
            <Text2>林晏先<Span>先先教練</Span></Text2>
          </div>

          <div>
            <Text>顏兆寅<Span>小顏教練</Span></Text>
            <PicImg src={img6} alt="" />

          </div>

          <div>
            <PicImg src={img7} alt="" />
            <Text>林政蔚<Span>政蔚教練</Span></Text>
          </div>

          <div>
            <Text>夏振凱<Span>凱凱教練</Span></Text>
            <PicImg src={img8} alt="" />

          </div>
        </Row1>
      </MobileContainer>

    </Container>

    <MobileContainer>
      <Row1>
        <Pic>
          <PicImg src={img11} alt="" />
          <Name1>
            <Text11>呂昀<Span>Eva教練</Span></Text11>
          </Name1>
        </Pic>

        <Pic2>
          <Name2>
            <Text>鍾達威<Span2>威廉教練</Span2></Text>
          </Name2>
          <PicImg2 src={img22} alt="" />
        </Pic2>

        <Pic>
          <PicImg src={img33} alt="" />
          <Name1>
            <Text111>林培中<Span1>派派教練</Span1></Text111>
          </Name1>
        </Pic>

        <Pic2>
          <Name2>
            <Text>郭則寬<Span2>阿寬教練</Span2></Text>
          </Name2>
          <PicImg2 src={img44} alt="" />
        </Pic2>

        <Pic>
          <PicImg src={img55} alt="" />
          <Name1>
            <Text111>林晏先<Span1>先先教練</Span1></Text111>
          </Name1>
        </Pic>

        <Pic2>
          <Name2>
            <Text>顏兆寅<Span2>小顏教練</Span2></Text>
          </Name2>
          <PicImg2 src={img66} alt="" />
        </Pic2>

        <Pic>
          <PicImg src={img77} alt="" />
          <Name1>
            <Text111>林政蔚<Span1>政蔚教練</Span1></Text111>
          </Name1>
        </Pic>

        <Pic2>
          <Name2>
            <Text>夏振凱<Span2>凱凱教練</Span2></Text>
          </Name2>
          <PicImg2 src={img88} alt="" />
        </Pic2>
      </Row1>
    </MobileContainer>
  </PageContainer>;
};

export default OurCouchMembers;
