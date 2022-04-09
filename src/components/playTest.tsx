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

const TextContainer = styled.div`
  

`;

const Text1 = styled.div`

`;

const Text2 = styled.div`

`;

const Text3 = styled.div`

`;

const Title1 = styled.p`

`;

const Title2 = styled.p`

`;

const Title3 = styled.p`

`;

const SloganText = styled.p`

`;

const TextContent = styled.p`

`;

/* desktop thw newest info style end */
const PlayTest = () => {
  return <PageContainer>
    <Container>
      <TextContainer>
        <Text1>
          <Title1></Title1>
          <Title2></Title2>
        </Text1>
        <Text2>
          <Title3></Title3>
          <SloganText></SloganText>
          <SloganText></SloganText>
          <SloganText></SloganText>
        </Text2>
        <Text3>
          <TextContent></TextContent>
        </Text3>
      </TextContainer>

      <div>
        <img src="" alt="" />
      </div>


    </Container>

  </PageContainer>;
};

export default PlayTest;
