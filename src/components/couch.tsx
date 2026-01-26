import React from "react";
import styled from "styled-components";
import {
  PageContainer,
  DesktopContainer,
  MobileContainer,
  SectionSubtitle,
} from "../styles/components";
import { media, theme } from "../styles/theme";
import couch from "../assets/couch/coach.png";
import couchMobile from "../assets/couch/coach-mobile.png";

const CouchImg = styled.div`
  width: 100%;
  height: 100vh;
  background-image: url('${couch}');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  padding-top: 330px;
  
  ${media.tablet} {
    height: auto;
    padding-top: 0;
  }
`;

const CouchMobileImg = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  height: 428px;
  background-image: url('${couchMobile}');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

const StyledTitle = styled(SectionSubtitle)`
  color: #CFD2D3;
  font-family: ${theme.fonts.secondary};
  
  ${media.tablet} {
    margin-top: -180px;
    align-items: center;
    display: flex;
    justify-content: center;
  }
`;

const Couch = () => {
  return (
    <PageContainer id="couch">
      <DesktopContainer>
        <CouchImg>
          <StyledTitle as="h2">Our Coach</StyledTitle>
        </CouchImg>
      </DesktopContainer>

      <MobileContainer style={{ marginTop: '-36px' }}>
        <CouchMobileImg>
          <StyledTitle as="h2">Our Coach</StyledTitle>
        </CouchMobileImg>
      </MobileContainer>
    </PageContainer>
  );
};

export default Couch;
