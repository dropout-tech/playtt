import React, { useState, Suspense, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Logo from "../../assets/homepage/logo.png";
import Menu from "../../assets/homepage/menu.png";
import Close from "../../assets/homepage/close.png";
import { media, theme } from "../../styles/theme";
import DrawerMenu from "./DrawerMenu";
import Footer from "../footer";

const pulse = styled.keyframes`
  0% { box-shadow: 0 0 0 0 rgba(56, 212, 48, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(56, 212, 48, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 212, 48, 0); }
`;

const FloatingReserveButton = styled.button`
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 72px;
  height: 72px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #38D430 0%, #2BA325 100%);
  color: white;
  cursor: pointer;
  z-index: 1000001;
  box-shadow: 0 10px 25px rgba(43, 163, 37, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: ${theme.fonts.primary};
  font-weight: 900;
  letter-spacing: 0.05em;
  line-height: 1.2;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: ${pulse} 2s infinite;

  &:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 15px 35px rgba(43, 163, 37, 0.5);
    background: linear-gradient(135deg, #42E639 0%, #2BA325 100%);
  }

  ${media.tablet} {
    top: auto;
    bottom: 24px;
    right: 20px;
    transform: none;
    width: 64px;
    height: 64px;
    animation: none; /* Reduce noise on mobile */
    
    &:hover {
      transform: scale(1.05);
    }
  }
`;

const FloatingText = styled.span`
  font-size: 13px;
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  padding-top: 80px; /* Space for fixed header */
`;

const Header = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 80px;
  align-items: center;
  padding: 0 30px;
  position: fixed;
  background-color: white;
  z-index: 99999999;
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const MobileHeader = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 80px;
  align-items: center;
  padding: 0 20px 0 30px;
  position: fixed;
  background-color: white;
  z-index: 999999;
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  box-sizing: border-box;
  @media screen and (min-width: 769px) {
    display: none;
  }
`;

const LogoImage = styled.img`
  width: 151px;
  height: 24.5px;
  cursor: pointer;
`;

const MenuImage = styled.img`
  width: 32px;
  height: 32px;
  cursor: pointer;
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const NavLink = styled(Link) <{ $active: boolean }>`
  text-decoration: none;
  padding: 10px 15px;
  font-family: "Noto Sans TC";
  font-weight: 700;
  font-size: 15px;
  color: ${props => (props.$active ? "#005CB9" : "#1A1A1A")};
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 15px;
    right: 15px;
    bottom: 2px;
    height: 3px;
    border-radius: 999px;
    background: ${theme.colors.accent};
    transform: scaleX(${props => (props.$active ? 1 : 0)});
    transition: transform 0.16s ease;
  }

  &:hover::after {
    transform: scaleX(1);
  }
`;

const NAV_ITEMS = [
  { path: "/", label: "首頁", isHash: false },
  { path: "/class", label: "課程資訊", isHash: false },
  { path: "/partner", label: "合作招募", isHash: false },
  { path: "/#company", label: "聯絡我們", isHash: true },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } else if (location.pathname) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  const handleLogoClick = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Header>
        <LogoImage src={Logo} alt="Let's Play Logo" onClick={handleLogoClick} />
        <NavList>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              $active={location.pathname === item.path || (item.isHash && location.hash === item.path.split('#')[1])}
            >
              {item.label}
            </NavLink>
          ))}
        </NavList>
      </Header>

      <MobileHeader>
        <LogoImage src={Logo} alt="Let's Play Logo" onClick={handleLogoClick} />
        <MenuImage src={open ? Close : Menu} alt="Menu" onClick={() => setOpen(!open)} />
      </MobileHeader>

      <DrawerMenu
        open={open}
        onClose={() => setOpen(false)}
        items={NAV_ITEMS.map(i => ({ id: i.path, label: i.label }))}
        activeIdx={NAV_ITEMS.findIndex(i => i.path === location.pathname)}
        onItemClick={(idx, path) => {
          setOpen(false);
          if (path.startsWith("/#")) {
            navigate("/");
            setTimeout(() => {
              const id = path.replace("/#", "");
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          } else {
            navigate(path);
          }
        }}
        size="100%"
      />

      <PageWrapper>
        <Suspense fallback={null}>
          {children}
        </Suspense>
        <Footer />
      </PageWrapper>

      <FloatingReserveButton
        type="button"
        aria-label="立即預約"
        onClick={() => window.open("https://line.me/R/ti/p/@869usyqy", "_blank")}
      >
        <FloatingText>立即</FloatingText>
        <FloatingText>預約</FloatingText>
      </FloatingReserveButton>
    </>
  );
};

export default Layout;
