import React from "react";
import styled from "styled-components";
import couch from "../assets/couch/couch.png";
import couchMobile from "../assets/couch/couch-mobile.png";

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

const CouchMobileImg = styled.img`
@media screen and (max-width: 768px) {
  width: 100%;
  height:100%;;
  }
`;

/* desktop thw newest info style end */
const Couch = () => {
  return <PageContainer id="couch">
    <Container>
      <CouchImg src={couch} alt="" />
    </Container>

    <MobileContainer>
      <CouchMobileImg src={couchMobile} alt="" />
    </MobileContainer>
  </PageContainer>;
};

export default Couch;
