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




// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
    @media screen and (max-width: 768px) {
    
  }
`;


const CouchImg = styled.img`
  width: 100%;
  height:100%;
    @media screen and (max-width: 768px) {
    
  }
`;



const Container = styled.div`
 padding-top:80px;
 padding-bottom:80px;
 width:100%;
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

const Row1 = styled.div`
  display: flex;
    @media screen and (max-width: 768px) {
   display: flex;
    flex-direction: column;
  }
`;

const Row2 = styled.div`
  display: flex;
  flex-direction: row;
  margin-left:100px;
    @media screen and (max-width: 768px) {
    
  }
`;

const Row3 = styled.div`
  display: flex;
  flex-direction: row;
    @media screen and (max-width: 768px) {
    
  }
`;

const Picture = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  align-items: center;
    @media screen and (max-width: 768px) {
     display:none;
  }
`;

const MobileContainer = styled.div`
  display:flex;
  flex-direction: column;
   
  @media screen and (min-width: 768px) {
    display:none;
  }
`;

const Text = styled.p`
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
   flex-direction: column
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
  @media screen and (max-width: 768px) {
   margin-left:0px;
   display:flex;
   flex-direction: column
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
    
  }
`;


const BelowText = styled.p`
  display:flex;
  flex-direction:column;
  @media screen and (max-width: 768px) {
    
  }
`;

const Pic = styled.div`
  @media screen and (max-width: 768px) {
    display:flex;
    justify-content:space-between;
    flex-direction: row;
    
  }
`;

const Name = styled.div`

  @media screen and (max-width: 768px) {
  display: flex;
  flex-direction: column;
  }
  
`;



/* desktop thw newest info style end */
const OurCouchMembers = () => {
  return <PageContainer>
    <Container>
      <Picture>
        <Row1>
          <div>
            <PicImg src={img1} alt="" />
            <Text>呂昀<Span>Eva教練</Span></Text>
          </div>

          <div>
            <PicImg src={img2} alt="" />
            <Text>鍾達威<Span>威廉教練</Span></Text>
          </div>

          <div>
            <PicImg src={img3} alt="" />
            <Text>林培中<Span>派派教練</Span></Text>
          </div>
        </Row1>

        <Row2>
          <div>
            <PicImg src={img4} alt="" />
            <Text2>郭則寬<Span>阿寬教練</Span></Text2>
          </div>

          <div>
            <PicImg src={img5} alt="" />
            <Text2>林晏先<Span>先先教練</Span></Text2>
          </div>


        </Row2>

        <Row3>
          <div>
            <PicImg src={img6} alt="" />
            <Text>顏兆寅<Span>小顏教練</Span></Text>
          </div>

          <div>
            <PicImg src={img7} alt="" />
            <Text>林政蔚<Span>政蔚教練</Span></Text>
          </div>

          <div>
            <PicImg src={img8} alt="" />
            <Text>夏振凱<Span>凱凱教練</Span></Text>
          </div>
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
          <PicImg src={img1} alt="" />
          <Name>
            <Text>呂昀<Span>Eva教練</Span></Text>
          </Name>
        </Pic>

        <div>
          <PicImg src={img2} alt="" />
          <Text>鍾達威<Span>威廉教練</Span></Text>


        </div>

        <div>
          <PicImg src={img3} alt="" />
          <Text>林培中<Span>派派教練</Span></Text>
        </div>

        <div>
          <PicImg src={img4} alt="" />
          <Text2>郭則寬<Span>阿寬教練</Span></Text2>


        </div>

        <div>
          <Text2>林晏先<Span>先先教練</Span></Text2>
          <PicImg src={img5} alt="" />

        </div>

        <div>
          <PicImg src={img6} alt="" />
          <Text>顏兆寅<Span>小顏教練</Span></Text>


        </div>

        <div>
          <PicImg src={img7} alt="" />
          <Text>林政蔚<Span>政蔚教練</Span></Text>
        </div>

        <div>
          <PicImg src={img8} alt="" />
          <Text>夏振凱<Span>凱凱教練</Span></Text>


        </div>
      </Row1>
    </MobileContainer>


  </PageContainer>;
};

export default OurCouchMembers;
