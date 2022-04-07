import React from "react";
import styled from "styled-components";
import couch from "../assets/ourcouch/couch.png";



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
  height:100%px;
`;

const Container = styled.div`
 margin-top:280px;
`;





/* desktop thw newest info style end */
const ourcouch = () => {
  return <PageContainer>
    <Container>
      <div>
        <CouchImg src={couch} alt="" />
      </div>

    </Container>


  </PageContainer>;
};

export default ourcouch;
