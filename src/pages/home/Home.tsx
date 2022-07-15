import React, { useState } from "react";
import styled from "styled-components";
import Homepage from "../../components/homepage";
// import Story from "../../components/story";
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
import Reserve from "../../components/reserve";
import Logo from "../../assets/homepage/logo.png";
import Focused from "../../assets/homepage/focused.png";
import Menu from "../../assets/homepage/menu.png";
import Close from "../../assets/homepage/close.png";
import Light from "../../assets/homepage/light.png";
import GreenLight from "../../assets/homepage/green-light.png";
// import component 👇
import Drawer from 'react-modern-drawer'

//import styles 👇
import 'react-modern-drawer/dist/index.css'


const SideDrawer = styled(Drawer)`
  /* margin-top:80px; */
  display: flex;
  flex-direction: column;
  padding-left: 30px;
  padding-top: 20px;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: scroll;
  @media screen and (max-width: 414px) {
    height: 100vh;
  }
`;

const Header = styled.div`
  /* width: 100%; */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height:80px;
  align-items: center;
  padding-left:30px;
  padding-right:30px;
  position: absolute;
  background-color: white;
  z-index: 99999999;
  width: 96.5%;
  @media screen and (max-width: 1280px) {
    width: 96%;
  }
  @media screen and (max-width: 768px) {
    width: 92.2%;
  }
  @media screen and (max-width: 414px) {
    display: none;
  }
`;

const MobileHeader = styled.div`
  /* width: 100%; */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height:80px;
  align-items: center;
  padding-left:20px;
  padding-right:30px;
  position: fixed;
  background-color: white;
  z-index: 999999;
  width: 88%;
  @media screen and (min-width: 768px) {
    display: none;
  }
`;

const LogoImage = styled.img`
  width: 151px;
  height: 24.5px;
  @media screen and (max-width: 414px) {
    margin-right: 50px;
  }
`;

const LightImage = styled.img`
  width: 24px;
  height: 24px;
`;

const MenuImage = styled.img`
  width: 32px;
  height: 32px;
  margin-bottom:-4px;
  margin-right:30px;
  @media screen and (min-width: 1280px) {
    display: none;
  }
`;

const FocusImage = styled.img<{ index: number, active: number }>`
  width: ${props => props.index === 4 ? "110px" : props => props.index === 5 ? "80px" : "66px"};
  height: 6px;
  margin-top:8px;
  display: ${props => props.index === props.active ? "block" : "none"};
`;

const HeaderButton = styled.button<{ index: number, active: number }>`
    background: transparent;
    border:none;
    font-family: "Noto Sans TC";
    font-weight: 700;
    font-size: 16px;
    margin-top: ${props => props.index === props.active ? "14px" : "0"};
    cursor: pointer;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  align-items: center;
  margin-left:20px;
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  @media screen and (max-width: 1280px) {
    display: none;
  }
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const MobileText = styled.p`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: "Noto Sans TC";
  font-weight: 700;
  font-size: 16px;
  margin-left:20px;
  margin-bottom:20px;
`;


/* desktop thw newest info style end */
const Home = () => {
  const [active, setActive] = useState(-1)
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      <Header>
        <div>
          {open ? <MenuImage src={Close} onClick={() => {
            setOpen(false)
          }} /> : <MenuImage src={Menu} onClick={() => {
            setOpen(true)
          }} />}

          <LogoImage src={Logo} onClick={() => {
              setActive(-1)
              const section = document.querySelector( '#home' );
              section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }} />
        </div>
        <RowContainer>
          <ButtonContainer>
            <HeaderButton index={0} active={active} onClick={() => {
              setActive(0)
              const section = document.querySelector( '#about' );
              section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>關於我們</HeaderButton>
            <FocusImage src={Focused} index={0} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={1} active={active} onClick={() => {
              setActive(1)
              const section = document.querySelector( '#classes' );
              section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }} >課程介紹</HeaderButton>
            <FocusImage src={Focused} index={1} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={2} active={active} onClick={() => {
              setActive(2)
              const section = document.querySelector( '#couch' );
              section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>師資介紹</HeaderButton>
            <FocusImage src={Focused} index={2} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={3} active={active} onClick={() => {
              setActive(3)
              const section = document.querySelector( '#alliancePlan' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>聯盟計畫</HeaderButton>
            <FocusImage src={Focused} index={3} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={4} active={active} onClick={() => {
              setActive(4)
              const section = document.querySelector( '#letsPlayStar' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>藝人明星桌球隊</HeaderButton>
            <FocusImage src={Focused} index={4} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={5} active={active} onClick={() => {
              setActive(5)
              const section = document.querySelector( '#partnershipAndRecruit' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>合作與招募</HeaderButton>
            <FocusImage src={Focused} index={5} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={6} active={active} onClick={() => {
              setActive(6)
              const section = document.querySelector( '#playTest' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>桌球檢定</HeaderButton>
            <FocusImage src={Focused} index={6} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={7} active={active} onClick={() => {
              setActive(7)
              const section = document.querySelector( '#conTest' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>桌球賽事</HeaderButton>
            <FocusImage src={Focused} index={7} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={8} active={active} onClick={() => {
              setActive(8)
              const section = document.querySelector( '#otherService' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>其他服務</HeaderButton>
            <FocusImage src={Focused} index={8} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={9} active={active} onClick={() => {
              setActive(9)
              const section = document.querySelector( '#haveATry' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}>聯絡我們</HeaderButton>
            <FocusImage src={Focused} index={9} active={active} />
          </ButtonContainer>
        </RowContainer>
      </Header>
      <Container>
        <SideDrawer
          open={open}
          onClose={() => { setOpen(false) }}
          direction='left'
          className='bla bla bla'
          size={286}
          zIndex={10000}
        >
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(0)
            setOpen(false)
            const section = document.querySelector( '#about' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 0 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>關於我們</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(1)
            setOpen(false)
            const section = document.querySelector( '#classes' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 1 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>課程介紹</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(2)
            setOpen(false)
            const section = document.querySelector( '#couch' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 2 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>師資介紹</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(3)
            setOpen(false)
            const section = document.querySelector( '#alliancePlan' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 3 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>聯盟計畫</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(4)
            setOpen(false)
            const section = document.querySelector( '#letsPlayStar' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 4 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>藝人明星桌球隊</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(5)
            setOpen(false)
            const section = document.querySelector( '#partnershipAndRecruit' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 5 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>合作與招募</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(6)
            setOpen(false)
            const section = document.querySelector( '#playTest' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 6 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>桌球檢定</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(7)
            setOpen(false)
            const section = document.querySelector( '#conTest' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 7 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>桌球賽事</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(8)
            setOpen(false)
            const section = document.querySelector( '#otherService' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 8 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>其他服務</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(9)
            setOpen(false)
            const section = document.querySelector( '#haveATry' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 9 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>聯絡我們</MobileText>
          </Row>

        </SideDrawer>
        <SideDrawer
          open={mobileOpen}
          onClose={() => { setMobileOpen(false) }}
          direction='left'
          className='bla bla bla'
          size={"100%"}
          zIndex={100000}
        >
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(0)
            setMobileOpen(false)
            const section = document.querySelector( '#about' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 0 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>關於我們</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(1)
            setMobileOpen(false)
            const section = document.querySelector( '#classes' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 1 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>課程介紹</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(2)
            setMobileOpen(false)
            const section = document.querySelector( '#couch' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 2 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>師資介紹</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(3)
            setMobileOpen(false)
            const section = document.querySelector( '#alliancePlan' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 3 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>聯盟計畫</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(4)
            setMobileOpen(false)
            const section = document.querySelector( '#letsPlayStar' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 4 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>藝人明星桌球隊</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(5)
            setMobileOpen(false)
            const section = document.querySelector( '#partnershipAndRecruit' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 5 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>合作與招募</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(6)
            setMobileOpen(false)
            const section = document.querySelector( '#playTest' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 6 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>桌球檢定</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(7)
            setMobileOpen(false)
            const section = document.querySelector( '#conTest' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 7 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>桌球賽事</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(8)
            setMobileOpen(false)
            const section = document.querySelector( '#otherService' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 8 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>其他服務</MobileText>
          </Row>
          <Row style={{ display: "flex", flexDirection: "row", alignItems: "center" }} onClick={() => {
            setActive(9)
            setMobileOpen(false)
            const section = document.querySelector( '#haveATry' );
            section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
          }}>
            {active === 9 ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
            <MobileText>聯絡我們</MobileText>
          </Row>

        </SideDrawer>
        <MobileHeader>

          {mobileOpen ? <MenuImage src={Close} onClick={() => {
            setMobileOpen(false)
          }} /> : <MenuImage src={Menu} onClick={() => {
            setMobileOpen(true)

          }} />}
          <LogoImage src={Logo} onClick={() => {
              setActive(-1)
              const section = document.querySelector( '#home' );
              section!.scrollIntoView( { behavior: 'smooth', block: 'start' } );
            }}/>
          <div></div>
        </MobileHeader>

        <Homepage/>
        <Reserve />
        <About />
        {/* <Story /> */}
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
    </>
  );
};

export default Home;
