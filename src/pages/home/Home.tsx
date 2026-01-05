import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
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
import Footer from "../../components/footer";
import Logo from "../../assets/homepage/logo.png";
import Menu from "../../assets/homepage/menu.png";
import Close from "../../assets/homepage/close.png";
import Light from "../../assets/homepage/light.png";
import GreenLight from "../../assets/homepage/green-light.png";
import { media, theme } from "../../styles/theme";
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

const pulse = keyframes`
  0% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(-50%) scale(1.03); }
  100% { transform: translateY(-50%) scale(1); }
`;

const FloatingReserveButton = styled.button`
  position: fixed;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 68px;
  height: 68px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.55);
  background: ${theme.colors.accent};
  color: ${theme.colors.background};
  cursor: pointer;
  z-index: 1000001;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);
  display: grid;
  place-items: center;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  letter-spacing: 0.04em;
  line-height: 1.1;

  animation: ${pulse} 1.8s ease-in-out infinite;

  &:hover {
    filter: saturate(1.05);
  }

  &:active {
    transform: translateY(-50%) scale(0.98);
  }

  &:focus-visible {
    outline: 4px solid rgba(255, 217, 0, 0.45);
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  ${media.tablet} {
    top: auto;
    bottom: 18px;
    right: 14px;
    transform: none;
    width: 60px;
    height: 60px;
  }
`;

const FloatingText = styled.span`
  font-size: 13px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  /* 避免桌機出現「雙捲軸」：讓 body 负责捲動即可 */
  overflow-y: visible;
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
  left: 0;
  right: 0;
  width: 100%;
  box-sizing: border-box;
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
  left: 0;
  right: 0;
  width: 100%;
  box-sizing: border-box;
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

const HeaderButton = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  padding: 10px 6px 12px;
  font-family: "Noto Sans TC";
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.02em;
  color: ${props => (props.$active ? "#005CB9" : "#1A1A1A")};
  cursor: pointer;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 6px;
    height: 3px;
    border-radius: 999px;
    background: ${theme.colors.accent};
    transform: scaleX(${props => (props.$active ? 1 : 0)});
    transform-origin: left;
    transition: transform 0.16s ease;
  }

  &:hover::after {
    transform: scaleX(1);
  }

  &:focus-visible {
    outline: 3px solid rgba(56, 212, 48, 0.35);
    outline-offset: 4px;
    border-radius: 10px;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      transition: none;
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  align-items: center;
  margin-left: 14px;
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  @media screen and (max-width: 1280px) {
    display: none;
  }
`;

const DrawerItemButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  border: none;
  background: ${props => (props.$active ? "rgba(0, 92, 185, 0.06)" : "transparent")};
  border-radius: 12px;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: rgba(0, 92, 185, 0.08);
  }

  &:focus-visible {
    outline: 3px solid rgba(56, 212, 48, 0.35);
    outline-offset: 3px;
  }
`;

const MobileText = styled.span`
  font-family: "Noto Sans TC";
  font-weight: 700;
  font-size: 16px;
  line-height: 22px;
`;

type NavItem = {
  id: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "about", label: "關於我們" },
  { id: "classes", label: "課程介紹" },
  { id: "couch", label: "師資介紹" },
  { id: "alliancePlan", label: "聯盟計畫" },
  { id: "partnershipAndRecruit", label: "合作與招募" },
  { id: "playTest", label: "桌球檢定" },
  { id: "conTest", label: "桌球賽事" },
  { id: "otherService", label: "其他服務" },
  { id: "company", label: "聯絡我們" },
];

function scrollToSection(id: string) {
  const section = document.querySelector(`#${id}`);
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
}


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
          {NAV_ITEMS.map((item, idx) => (
            <ButtonContainer key={item.id}>
              <HeaderButton $active={active === idx} onClick={() => {
                setActive(idx)
                scrollToSection(item.id)
              }}>{item.label}</HeaderButton>
            </ButtonContainer>
          ))}
        </RowContainer>
      </Header>
      <Container>
        <FloatingReserveButton
          type="button"
          aria-label="立即預約免費試上（開啟 Facebook 私訊）"
          onClick={() => {
            window.open("https://www.facebook.com/playpp2018", "_parent");
          }}
        >
          <FloatingText>立即</FloatingText>
          <FloatingText>預約</FloatingText>
        </FloatingReserveButton>

        <SideDrawer
          open={open}
          onClose={() => { setOpen(false) }}
          direction='left'
          className='bla bla bla'
          size={286}
          zIndex={10000}
        >
          {NAV_ITEMS.map((item, idx) => (
            <DrawerItemButton key={item.id} $active={active === idx} onClick={() => {
              setActive(idx);
              setOpen(false);
              scrollToSection(item.id);
            }}>
              {active === idx ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
              <MobileText>{item.label}</MobileText>
            </DrawerItemButton>
          ))}

        </SideDrawer>
        <SideDrawer
          open={mobileOpen}
          onClose={() => { setMobileOpen(false) }}
          direction='left'
          className='bla bla bla'
          size={"100%"}
          zIndex={100000}
        >
          {NAV_ITEMS.map((item, idx) => (
            <DrawerItemButton key={item.id} $active={active === idx} onClick={() => {
              setActive(idx);
              setMobileOpen(false);
              scrollToSection(item.id);
            }}>
              {active === idx ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
              <MobileText>{item.label}</MobileText>
            </DrawerItemButton>
          ))}

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
        <About />
        {/* <Story /> */}
        <Classes />
        <Couch />
        <OurCouchMembers />
        <AlliancePlan />
        <PartnershipAndRecruit />
        <Recruit />
        <PlayTest />
        <ConTest />
        <OtherService />
        <Footer />
      </Container>
    </>
  );
};

export default Home;
