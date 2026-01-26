import React from 'react';
import styled from 'styled-components';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import { theme } from '../../styles/theme';
import Light from "../../assets/homepage/light.png";
import GreenLight from "../../assets/homepage/green-light.png";

const SideDrawer = styled(Drawer)`
  display: flex;
  flex-direction: column;
  padding-left: 30px;
  padding-top: 20px;
  /* Ensure proper z-index stacking context if needed */
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
    border-radius: 12px;
  }
`;

const LightImage = styled.img`
  width: 24px;
  height: 24px;
`;

const MobileText = styled.span`
  font-family: "Noto Sans TC";
  font-weight: 700;
  font-size: 16px;
  line-height: 22px;
  color: ${theme.colors.text};
`;

type NavItem = {
    id: string;
    label: string;
};

interface DrawerMenuProps {
    open: boolean;
    onClose: () => void;
    items: NavItem[];
    activeIdx: number;
    onItemClick: (idx: number, id: string) => void;
    size?: number | string;
    zIndex?: number;
    className?: string;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({
    open,
    onClose,
    items,
    activeIdx,
    onItemClick,
    size = 286,
    zIndex = 10000,
    className
}) => {
    return (
        <SideDrawer
            open={open}
            onClose={onClose}
            direction='left'
            size={size}
            zIndex={zIndex}
            className={className}
        >
            {items.map((item, idx) => (
                <DrawerItemButton
                    key={item.id}
                    $active={activeIdx === idx}
                    onClick={() => onItemClick(idx, item.id)}
                >
                    {activeIdx === idx ? (
                        <LightImage src={GreenLight} alt="" />
                    ) : (
                        <LightImage src={Light} alt="" />
                    )}
                    <MobileText>{item.label}</MobileText>
                </DrawerItemButton>
            ))}
        </SideDrawer>
    );
};

export default DrawerMenu;
