import React from "react";
import styled from "styled-components";
import couch from "../assets/couch/couch.png";


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
  margin-top:330px;

`;


/* desktop thw newest info style end */
const Couch = () => {
  return <PageContainer>
    <CouchImg src={couch} alt="" />
  </PageContainer>;
};

export default Couch;
