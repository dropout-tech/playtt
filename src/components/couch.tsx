import React from "react";
import styled from "styled-components";
import couch from "../assets/couch/coach.png";
import couchMobile from "../assets/couch/coach-mobile.png";

// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  @media screen and (max-width: 768px) {
    
  }
`;

const CouchImg = styled.div`
width: 100%;
height:100vh;
    background-image: url('${couch}');
  background-size:contain ;
  background-repeat: no-repeat;
  background-position:center;
  padding-top:330px;
   @media screen and (max-width: 768px) {

  }
`;

const Container = styled.div`
 padding-top:80px;
 padding-bottom:80px;
  @media screen and (max-width: 768px) {
   display:none;
  }
`;

const MobileContainer = styled.div`
  margin-top:-36px;
 
@media screen and (min-width: 768px) {
 display:none;
   
  }
`;

const CouchMobileImg = styled.div`
@media screen and (max-width: 768px) {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  height:428px;
  background-image: url('${couchMobile}');
  background-size:contain ;
  background-repeat: no-repeat;
  background-position:center;
  }
`;

const Title2 = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  line-Height:52px;
  
  @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 26px;
    line-height: 40px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.04em;
    color: #CFD2D3;
    margin-top:-180px;
  }
`;

/* desktop thw newest info style end */
const Couch = () => {
  return <PageContainer id="couch">
    <Container>
     <CouchImg>
     <Title2>Our Coach</Title2>
     </CouchImg>
      
    </Container>

    <MobileContainer>
      <CouchMobileImg>
      <Title2>Our Coach</Title2>
      </CouchMobileImg>
    </MobileContainer>
  </PageContainer>;
};

export default Couch;
