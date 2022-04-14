import React from "react";
import styled from "styled-components";
import couch from "../assets/couch/couch.png";


// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const CouchImg = styled.img`
  width: 100%;
  height:100%;
   @media screen and (min-width: 768px) {
    
  }
`;

const Container = styled.div`
 padding-top:80px;
 padding-bottom:80px;
  @media screen and (min-width: 768px) {
    
  }
`;

/* desktop thw newest info style end */
const Couch = () => {
  return <PageContainer>
    <Container>
      <CouchImg src={couch} alt="" />
    </Container>
  </PageContainer>;
};

export default Couch;
