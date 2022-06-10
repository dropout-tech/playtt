import React, { useState } from "react";
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
import Reserve from "../../components/reserve";
import Logo from "../../assets/homepage/logo.png";
import Focused from "../../assets/homepage/focused.png";
import Menu from "../../assets/homepage/menu.png";
// import component 👇
import Drawer from 'react-modern-drawer'

//import styles 👇
import 'react-modern-drawer/dist/index.css'


const SideDrawer = styled(Drawer)`
  margin-top:80px;
`

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  position: absolute;
  background-color: white;
  z-index: 999999;
  width: 86%;
  @media screen and (min-width: 414px) {
    display: none;
  }
`;

const LogoImage = styled.img`
  @import '~antd/dist/antd.css';
  width: 151px;
  height: 24.5px;
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

/* desktop thw newest info style end */
const Home = () => {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  return (
    <>
    <Header>
        <div>
          <MenuImage src={Menu}   onClick={() => {
              console.log("123")
              setOpen(true)
            }}/>
          <LogoImage src={Logo} />
        </div>
        <RowContainer>
          <ButtonContainer>
            <HeaderButton index={0} active={active} onClick={() => {
              setActive(0)
              setOpen(true)
            }}>關於我們</HeaderButton>
            <FocusImage src={Focused} index={0} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={1} active={active} onClick={() => {
              setActive(1)
            }} >課程介紹</HeaderButton>
            <FocusImage src={Focused} index={1} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={2} active={active} onClick={() => {
              setActive(2)
            }}>師資介紹</HeaderButton>
            <FocusImage src={Focused} index={2} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={3} active={active} onClick={() => {
              setActive(3)
            }}>聯盟計畫</HeaderButton>
            <FocusImage src={Focused} index={3} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={4} active={active} onClick={() => {
              setActive(4)
            }}>藝人明星桌球隊</HeaderButton>
            <FocusImage src={Focused} index={4} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={5} active={active} onClick={() => {
              setActive(5)
            }}>合作與招募</HeaderButton>
            <FocusImage src={Focused} index={5} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={6} active={active} onClick={() => {
              setActive(6)
            }}>桌球檢定</HeaderButton>
            <FocusImage src={Focused} index={6} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={7} active={active} onClick={() => {
              setActive(7)
            }}>桌球賽事</HeaderButton>
            <FocusImage src={Focused} index={7} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={8} active={active} onClick={() => {
              setActive(8)
            }}>其他服務</HeaderButton>
            <FocusImage src={Focused} index={8} active={active} />
          </ButtonContainer>
          <ButtonContainer>
            <HeaderButton index={9} active={active} onClick={() => {
              setActive(9)
            }}>聯絡我們</HeaderButton>
            <FocusImage src={Focused} index={9} active={active} />
          </ButtonContainer>
        </RowContainer>
      </Header>
    <Container>
      <SideDrawer
        open={open}
        onClose={()=>{setOpen(false)}}
        direction='left'
        className='bla bla bla'
        size={500}
        zIndex={0}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </SideDrawer>
      <MobileHeader>
        
          <MenuImage src={Menu}  onClick={() => {
              console.log("123")
              setOpen(true)
            }}/>
          <LogoImage src={Logo} />
          <div></div>
      </MobileHeader>
      
      <Homepage />
      <Reserve />
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
    </>
  );
};

export default Home;
