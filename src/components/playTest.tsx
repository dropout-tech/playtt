import React from "react";
import styled from "styled-components";
import testpic from "../assets/playTest/testpic.png";



// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
  width: 100%;
  height:100%;
  display:flex;
`;


/* desktop thw newest info style end */
const PlayTest = () => {
  return <PageContainer>
    <Container>
      <div>
        <div>
          <p></p>
          <p></p>
        </div>
        <div>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
        </div>
        <div>
          <p></p>
        </div>
      </div>

      <div>
        <img src="" alt="" />
      </div>


    </Container>

  </PageContainer>;
};

export default PlayTest;
