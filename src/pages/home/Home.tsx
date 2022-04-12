import React from "react";
import styled from "styled-components";
import Homepage from "../../components/homepage";
import Story from "../../components/story";
import About from "../../components/about";
import Classes from "../../components/classes";
import OurCouchMembers from "../../components/ourCouchMembers";
import Couch from "../../components/couch";
import AlliancePlan from "../../components/alliancePlan";
import PartnershipAndRecruit from "../../components/partnershipAndRecruit";
import Recruit from "../../components/recruit";
import PlayTest from "../../components/playTest";
import ConTest from "../../components/conTest";
import OtherService from "../../components/otherService";
import Company from "../../components/company";
import HaveATry from "../../components/haveATry";
import LetsPlayStar from "../../components/letsPlayStar";




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
      <Homepage />
      <About />
      <Story />
      <Classes />
      <Couch />
      <OurCouchMembers />
      <AlliancePlan />
      <LetsPlayStar />
      <PartnershipAndRecruit />
      <Recruit />
      <PlayTest />
      <ConTest />
      <OtherService />
      <Company />
      <HaveATry />
    </Container>


  );
};

export default Home;
