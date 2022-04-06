import React from "react";
import styled from "styled-components";
import About from "../../components/about"
import Classes from "../../components/classes"

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

/* desktop thw newest info style end */
const Home = () => {
  return (
  <Container>
    <About/>
    <Classes />
  </Container>
  );
};

export default Home;
