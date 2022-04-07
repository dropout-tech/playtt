import React from "react";
import styled from "styled-components";
import pic1 from "../assets/ourcouch/pic1.png";
import pic2 from "../assets/ourcouch/pic2.png";
import pic3 from "../assets/ourcouch/pic3.png";
import pic4 from "../assets/ourcouch/pic4.png";
import pic5 from "../assets/ourcouch/pic5.png";
import pic6 from "../assets/ourcouch/pic6.png";
import pic7 from "../assets/ourcouch/pic7.png";
import pic8 from "../assets/ourcouch/pic8.png";
import pic9 from "../assets/ourcouch/pic9.png";



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
 margin-top:280px;
`;

const PicImg = styled.img`
  width:310px;
  height:300px;
`;

const Row1 = styled.div`
  display: flex;
  flex-direction: row;
`;

const Row2 = styled.div`
  display: flex;
  flex-direction: row;
`;

const Row3 = styled.div`
  display: flex;
  flex-direction: row;
`;
  



/* desktop thw newest info style end */
const ourcouch = () => {
  return <PageContainer>
    <Container>
      <div>
        <Row1>
          <div>
            <PicImg src={pic1} alt="" />
            <p>張昀容<span>教練</span></p>
          </div>

          <div>
            <PicImg src={pic2} alt="" />
            <p>陳旻明<span>教練</span></p>
          </div>

          <div>
            <PicImg src={pic3} alt="" />
            <p>陳智鈞<span>教練</span></p>
          </div>
        </Row1>

        <Row2>
          <div>
            <PicImg src={pic4} alt="" />
            <p>張昀容<span>教練</span></p>
          </div>

          <div>
            <PicImg src={pic5} alt="" />
            <p>陳旻明<span>教練</span></p>
          </div>

          <div>
            <PicImg src={pic6} alt="" />
            <p>陳智鈞<span>教練</span></p>
          </div>
        </Row2>

        <Row3>
          <div>
            <PicImg src={pic7} alt="" />
            <p>張昀容<span>教練</span></p>
          </div>

          <div>
            <PicImg src={pic8} alt="" />
            <p>陳旻明<span>教練</span></p>
          </div>

          <div>
            <PicImg src={pic9} alt="" />
            <p>陳智鈞<span>教練</span></p>
          </div>
        </Row3>
      </div>
    </Container>


  </PageContainer>;
};

export default ourcouch;
