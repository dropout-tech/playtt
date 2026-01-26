import React from 'react';
import styled from 'styled-components';
import { SectionTitle, SectionSubtitle, TitleGroup } from '../../styles/components';
import { theme } from '../../styles/theme';

const WhiteTitle = styled(SectionTitle)`
  color: ${theme.colors.background};
`;

const WhiteSubtitle = styled(SectionSubtitle)`
  color: ${theme.colors.textMuted};
`;

interface SectionHeaderProps {
    title: string;
    subtitle: string;
    variant?: 'default' | 'white';
    className?: string;
    style?: React.CSSProperties;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    variant = 'default',
    className,
    style
}) => {
    const TitleComp = variant === 'white' ? WhiteTitle : SectionTitle;
    const SubtitleComp = variant === 'white' ? WhiteSubtitle : SectionSubtitle;

    return (
        <TitleGroup className={className} style={style}>
            <TitleComp>{title}</TitleComp>
            <SubtitleComp>{subtitle}</SubtitleComp>
        </TitleGroup>
    );
};

export default SectionHeader;
