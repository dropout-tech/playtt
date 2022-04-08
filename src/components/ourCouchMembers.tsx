import React from "react";
import styled from "styled-components";
import pic1 from "../assets/ourCouchMenber/pic1.png";
import pic2 from "../assets/ourCouchMenber/pic2.png";
import pic3 from "../assets/ourCouchMenber/pic3.png";
import pic4 from "../assets/ourCouchMenber/pic4.png";
import pic5 from "../assets/ourCouchMenber/pic5.png";
import pic6 from "../assets/ourCouchMenber/pic6.png";
import pic7 from "../assets/ourCouchMenber/pic7.png";
import pic8 from "../assets/ourCouchMenber/pic8.png";
import pic9 from "../assets/ourCouchMenber/pic9.png";



// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const CouchImg = styled.img`
  width: 100%;
  height:100%;
`;

const Container = styled.div`
 margin-top:50px;
 width:100%;
`;

const PicImg = styled.img`
  width:310px;
  height:300px;
  margin-left:80px;
`;

const Row1 = styled.div`
  display: flex;
  flex-direction: row;
`;

const Row2 = styled.div`
  display: flex;
  flex-direction: row;
  margin-left:100px;
`;

const Row3 = styled.div`
  display: flex;
  flex-direction: row;
`;

const Picture = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  align-items: center;
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
`;

const BelowText = styled.p`
  display:flex;
  flex-direction:column;
`;




/* desktop thw newest info style end */
const OurCouchMembers = () => {
  return <PageContainer>
    <Container>
      <Picture>
        <Row1>
          <div>
            <PicImg src={pic1} alt="" />
            <Text>張昀容<Span>教練</Span></Text>
          </div>

          <div>
            <PicImg src={pic2} alt="" />
            <Text>陳旻明<Span>教練</Span></Text>
          </div>

          <div>
            <PicImg src={pic3} alt="" />
            <Text>陳智鈞<Span>教練</Span></Text>
          </div>
        </Row1>

        <Row2>
          <div>
            <PicImg src={pic4} alt="" />
            <Text2>黃建宏<Span>教練</Span></Text2>
          </div>

          <div>
            <PicImg src={pic5} alt="" />
            <Text2>李彥峰<Span>教練</Span></Text2>
          </div>

          <div>
            <PicImg src={pic6} alt="" />
            <Text2>王宗穎<Span>教練</Span></Text2>
          </div>
        </Row2>

        <Row3>
          <div>
            <PicImg src={pic7} alt="" />
            <Text>王子傑<Span>教練</Span></Text>
          </div>

          <div>
            <PicImg src={pic8} alt="" />
            <Text>賴俊傑<Span>教練</Span></Text>
          </div>

          <div>
            <PicImg src={pic9} alt="" />
            <Text>張品卉<Span>教練</Span></Text>
          </div>
        </Row3>
      </Picture>


    </Container>


  </PageContainer>;
};

export default OurCouchMembers;
