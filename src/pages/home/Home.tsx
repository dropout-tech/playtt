import React, { useCallback, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import Homepage from "../../components/homepage";
// import Story from "../../components/story";
import About from "../../components/about";
import Classes from "../../components/classes";
import OurCouchMembers from "../../components/ourCouchMembers";
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

type NavItem = {
  key: number;
  label: string;
  targetId: string;
  focusWidth?: number;
};

const NAV_ITEMS: NavItem[] = [
  { key: 0, label: "關於我們", targetId: "about" },
  { key: 1, label: "課程介紹", targetId: "classes" },
  { key: 2, label: "師資介紹", targetId: "ourCouchMembers" },
  { key: 3, label: "聯盟計畫", targetId: "alliancePlan" },
  { key: 4, label: "藝人明星桌球隊", targetId: "letsPlayStar", focusWidth: 110 },
  { key: 5, label: "合作與招募", targetId: "partnershipAndRecruit", focusWidth: 80 },
  { key: 6, label: "合作招募", targetId: "recruit" },
  { key: 7, label: "桌球檢定", targetId: "playTest" },
  { key: 8, label: "桌球賽事", targetId: "conTest" },
  { key: 9, label: "其他服務", targetId: "otherService" },
  { key: 10, label: "聯絡我們", targetId: "company" },
];

const pop = keyframes`
  0% { transform: translate3d(0, 0, 0) scale(1); }
  40% { transform: translate3d(0, -2px, 0) scale(1.04); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
`;

const float = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -6px, 0); }
`;


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
  width: 100%;
  min-height: 100vh;
  min-height: 100svh;
  overflow-x: hidden;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height:80px;
  align-items: center;
  padding-left:30px;
  padding-right:30px;
  position: fixed;
  top: 0;
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(26, 26, 26, 0.06);
  z-index: 1000;
  left: 0;
  right: 0;
  width: 100%;
  box-sizing: border-box;
  @media screen and (max-width: 414px) {
    display: none;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height:80px;
  align-items: center;
  padding-left:20px;
  padding-right:30px;
  position: fixed;
  top: 0;
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(26, 26, 26, 0.06);
  z-index: 1000;
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
  transition: transform 0.22s ease, filter 0.22s ease;

  &:hover {
    transform: translate3d(0, -1px, 0) scale(1.03);
    filter: saturate(1.05);
  }

  &:active {
    transform: translate3d(0, 0, 0) scale(1);
  }

  @media screen and (min-width: 1280px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
      filter: none;
    }
  }
`;

const FocusImage = styled.img<{ $width: number; $active: boolean }>`
  width: ${props => `${props.$width}px`};
  height: 6px;
  margin-top:8px;
  opacity: ${props => (props.$active ? 1 : 0)};
  transform: ${props => (props.$active ? "translate3d(0, 0, 0) scaleX(1)" : "translate3d(0, -2px, 0) scaleX(0.85)")};
  transform-origin: center;
  transition: opacity 0.22s ease, transform 0.22s ease;
  animation: ${props => (props.$active ? pop : "none")} 420ms ease both;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
`;

const HeaderButton = styled.button<{ index: number, active: number }>`
    background: transparent;
    border:none;
    font-family: "Noto Sans TC";
    font-weight: 700;
    font-size: 16px;
    margin-top: ${props => props.index === props.active ? "14px" : "0"};
    cursor: pointer;
    transition: transform 0.18s ease, color 0.18s ease;

    &:hover {
      transform: translate3d(0, -1px, 0);
      color: #1a1a1a;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
      &:hover {
        transform: none;
      }
    }
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

const DrawerItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  transition: transform 0.18s ease;

  &:hover {
    transform: translate3d(2px, 0, 0);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const DrawerHint = styled.div`
  font-family: "Noto Sans TC";
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: rgba(26, 26, 26, 0.55);
`;


/* desktop thw newest info style end */
const Home = () => {
  const [active, setActive] = useState(-1)
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const focusWidthByKey = useMemo(() => {
    const map = new Map<number, number>();
    NAV_ITEMS.forEach((it) => map.set(it.key, it.focusWidth ?? 66));
    return map;
  }, []);

  const scrollToId = useCallback((targetId: string) => {
    const section = document.getElementById(targetId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goHome = useCallback(() => {
    setActive(-1);
    scrollToId("home");
  }, [scrollToId]);

  const onNav = useCallback(
    (item: NavItem, opts?: { closeDesktop?: boolean; closeMobile?: boolean }) => {
      setActive(item.key);
      if (opts?.closeDesktop) setOpen(false);
      if (opts?.closeMobile) setMobileOpen(false);
      scrollToId(item.targetId);
    },
    [scrollToId]
  );

  return (
    <>
      <Header>
        <div>
          {open ? <MenuImage src={Close} onClick={() => {
            setOpen(false)
          }} /> : <MenuImage src={Menu} onClick={() => {
            setOpen(true)
          }} />}

          <LogoImage src={Logo} onClick={goHome} />
        </div>
        <RowContainer>
          {NAV_ITEMS.slice(0, 6).map((item) => (
            <ButtonContainer key={item.key}>
              <HeaderButton index={item.key} active={active} onClick={() => onNav(item)}>
                {item.label}
              </HeaderButton>
              <FocusImage
                src={Focused}
                $width={focusWidthByKey.get(item.key) ?? 66}
                $active={item.key === active}
                alt=""
                aria-hidden
              />
            </ButtonContainer>
          ))}
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
          <DrawerHeader>
            <LightImage src={GreenLight} alt="" />
            <DrawerHint>選單</DrawerHint>
          </DrawerHeader>

          {NAV_ITEMS.map((item) => (
            <DrawerItem key={`desktop-${item.key}`} onClick={() => onNav(item, { closeDesktop: true })}>
              {active === item.key ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
              <MobileText style={{ animation: active === item.key ? `${float} 1.8s ease-in-out infinite` : "none" }}>
                {item.label}
              </MobileText>
            </DrawerItem>
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
          <DrawerHeader>
            <LightImage src={GreenLight} alt="" />
            <DrawerHint>選單</DrawerHint>
          </DrawerHeader>

          {NAV_ITEMS.map((item) => (
            <DrawerItem key={`mobile-${item.key}`} onClick={() => onNav(item, { closeMobile: true })}>
              {active === item.key ? <LightImage src={GreenLight} alt="" /> : <LightImage src={Light} alt="" />}
              <MobileText style={{ animation: active === item.key ? `${float} 1.8s ease-in-out infinite` : "none" }}>
                {item.label}
              </MobileText>
            </DrawerItem>
          ))}

        </SideDrawer>
        <MobileHeader>

          {mobileOpen ? <MenuImage src={Close} onClick={() => {
            setMobileOpen(false)
          }} /> : <MenuImage src={Menu} onClick={() => {
            setMobileOpen(true)

          }} />}
          <LogoImage src={Logo} onClick={goHome}/>
          <div></div>
        </MobileHeader>

        <Homepage/>
        <Reserve />
        <About />
        {/* <Story /> */}
        <Classes />
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
