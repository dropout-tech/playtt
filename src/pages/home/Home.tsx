import React from "react";
import styled from "styled-components";
import Hompage from "../../components/homepage";
import Story from "../../components/story";
import About from "../../components/about";
import Classes from "../../components/classes";
import OurCouchMembers from "../../components/ourCouchMembers";
import Couch from "../../components/couch";

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
      <Hompage />
      <About />
      <Story />
      <Classes />
      <Couch />
      <OurCouchMembers />
    </Container>

  );
};

export default Home;
